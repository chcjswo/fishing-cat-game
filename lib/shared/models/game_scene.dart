/// 게임(JS)의 현재 화면. 게임이 화면을 바꿀 때마다 'screen' 이벤트로
/// 보내는 이름과 1:1로 대응한다.
enum GameScene {
  title,
  credits,
  settings,
  intro,
  play,
  pause,
  result;

  static GameScene? fromName(String? name) =>
      name == null ? null : values.asNameMap()[name];
}
