// Real-time CDP runner: virtual-time budgets can expire before PNG decoding finishes.
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){
  const [fixture,profile,screenshot,width='640',height='1024']=process.argv.slice(2);
  const browser=spawn(process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',[
    '--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--no-default-browser-check',
    '--allow-file-access-from-files','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
  ],{stdio:'ignore',windowsHide:true});
  let socket;
  const exited=new Promise(resolve=>browser.once('exit',resolve));
  try{
    const portFile=path.join(profile,'DevToolsActivePort');
    for(let i=0;i<200&&!fs.existsSync(portFile);i++)await pause(50);
    if(!fs.existsSync(portFile))throw new Error('Browser startup timed out');
    const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
    const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list')).json();
    socket=new WebSocket(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    let seq=0;const pending=new Map();
    socket.addEventListener('message',event=>{const message=JSON.parse(event.data);const request=pending.get(message.id);if(request){pending.delete(message.id);message.error?request.reject(new Error(message.error.message)):request.resolve(message.result);}});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    await send('Emulation.setDeviceMetricsOverride',{width:Number(width),height:Number(height),deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:pathToFileURL(fixture).href});
    let verdict;
    for(let i=0;i<500;i++){
      const result=await send('Runtime.evaluate',{expression:"document.querySelector('#verdict')?.textContent",returnByValue:true});
      verdict=result.result.value;if(verdict)break;await pause(50);
    }
    if(!verdict)throw new Error('Browser test timed out');
    if(screenshot){const result=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(screenshot,Buffer.from(result.data,'base64'));}
    console.log(verdict);
    await send('Browser.close');
    await exited;
  }finally{
    socket?.close();
    if(browser.exitCode===null)browser.kill();
  }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
