#!/usr/bin/env python3
"""
Commit Message Generator
Analyzes staged changes and generates commit messages following team conventions
"""

import os
import sys
import subprocess
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional

class CommitAnalyzer:
    def __init__(self, repo_path: str = '.'):
        self.repo_path = Path(repo_path)
        self.commit_types = {
            'feat': '새로운 기능',
            'fix': '버그 수정',
            'docs': '문서 변경',
            'refactor': '리팩토링',
            'chore': '설정 변경',
            'test': '테스트 추가/수정',
            'style': '코드 스타일 변경',
            'perf': '성능 개선'
        }
        
    def _run_git_command(self, command: List[str]) -> Tuple[bool, str]:
        """Run a git command and return success status and output"""
        try:
            result = subprocess.run(
                command,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                encoding='utf-8'
            )
            return result.returncode == 0, result.stdout
        except Exception as e:
            return False, str(e)
    
    def get_staged_diff(self) -> Optional[str]:
        """Get the staged changes diff"""
        success, diff = self._run_git_command(['git', 'diff', '--staged'])
        
        if not success:
            print("❌ Error: Failed to get staged changes. Are you in a git repository?")
            return None
        
        if not diff.strip():
            print("⚠️  No staged changes found. Use 'git add' to stage files first.")
            return None
        
        return diff
    
    def get_staged_files(self) -> List[Dict[str, str]]:
        """Get list of staged files with their status"""
        success, output = self._run_git_command(['git', 'diff', '--staged', '--name-status'])
        
        if not success:
            return []
        
        files = []
        for line in output.strip().split('\n'):
            if not line:
                continue
            
            parts = line.split('\t', 1)
            if len(parts) == 2:
                status, filepath = parts
                files.append({
                    'status': status,
                    'path': filepath,
                    'type': self._get_file_type(filepath)
                })
        
        return files
    
    def _get_file_type(self, filepath: str) -> str:
        """Determine file type category"""
        path = Path(filepath)
        ext = path.suffix.lower()
        name = path.name.lower()
        
        # Documentation files
        if ext in ['.md', '.txt', '.rst'] or name in ['readme', 'changelog', 'license']:
            return 'docs'
        
        # Configuration files
        if name in ['package.json', 'pubspec.yaml', 'requirements.txt', 'setup.py', 
                    'cargo.toml', 'go.mod', '.gitignore', '.env']:
            return 'config'
        
        # Test files
        if 'test' in filepath.lower() or ext in ['.test.js', '.spec.js', '.test.ts', '.spec.ts']:
            return 'test'
        
        # Code files
        if ext in ['.py', '.js', '.ts', '.dart', '.java', '.go', '.rs', '.cpp', '.c', '.h']:
            return 'code'
        
        # Style files
        if ext in ['.css', '.scss', '.sass', '.less']:
            return 'style'
        
        return 'other'
    
    def analyze_changes(self, diff: str, files: List[Dict]) -> Dict:
        """Analyze the changes and extract meaningful information"""
        analysis = {
            'added_lines': 0,
            'removed_lines': 0,
            'modified_files': 0,
            'added_files': 0,
            'deleted_files': 0,
            'file_types': {},
            'key_changes': [],
            'suggested_type': None
        }
        
        # Count line changes
        for line in diff.split('\n'):
            if line.startswith('+') and not line.startswith('+++'):
                analysis['added_lines'] += 1
            elif line.startswith('-') and not line.startswith('---'):
                analysis['removed_lines'] += 1
        
        # Analyze files
        for file_info in files:
            status = file_info['status']
            file_type = file_info['type']
            
            if status == 'A':
                analysis['added_files'] += 1
            elif status == 'D':
                analysis['deleted_files'] += 1
            elif status == 'M':
                analysis['modified_files'] += 1
            
            # Count by file type
            analysis['file_types'][file_type] = analysis['file_types'].get(file_type, 0) + 1
        
        # Determine suggested commit type
        analysis['suggested_type'] = self._suggest_commit_type(analysis, files)
        
        # Extract key changes from diff
        analysis['key_changes'] = self._extract_key_changes(diff, files)
        
        return analysis
    
    def _suggest_commit_type(self, analysis: Dict, files: List[Dict]) -> str:
        """Suggest the most appropriate commit type"""
        file_types = analysis['file_types']
        
        # Documentation changes
        if file_types.get('docs', 0) > 0 and len(file_types) == 1:
            return 'docs'
        
        # Test changes
        if file_types.get('test', 0) > 0 and len(file_types) == 1:
            return 'test'
        
        # Configuration changes
        if file_types.get('config', 0) > 0 and analysis['modified_files'] <= 2:
            return 'chore'
        
        # Style changes
        if file_types.get('style', 0) > 0 and len(file_types) == 1:
            return 'style'
        
        # New files (likely new feature)
        if analysis['added_files'] > 0 and analysis['added_lines'] > analysis['removed_lines']:
            return 'feat'
        
        # Mostly deletions (refactoring or fix)
        if analysis['removed_lines'] > analysis['added_lines'] * 2:
            # Check if it looks like a bug fix (removing broken code)
            return 'fix'
        
        # Mixed changes (could be refactor)
        if analysis['modified_files'] > 2:
            return 'refactor'
        
        # Default to feat for new functionality
        return 'feat'
    
    def _extract_key_changes(self, diff: str, files: List[Dict]) -> List[str]:
        """Extract key changes from the diff"""
        changes = []
        
        # Look for function/class definitions
        function_pattern = r'^[+]\s*(?:def|function|class|const|let|var)\s+(\w+)'
        for line in diff.split('\n'):
            match = re.match(function_pattern, line)
            if match:
                name = match.group(1)
                changes.append(f"새로운 {name} 추가")
        
        # Look for import/require statements (new dependencies)
        import_pattern = r'^[+]\s*(?:import|require|use)\s+.*[\'"](.+)[\'"]'
        for line in diff.split('\n'):
            match = re.match(import_pattern, line)
            if match:
                module = match.group(1)
                changes.append(f"{module} 모듈 추가")
        
        # If no specific changes detected, use file-based description
        if not changes:
            for file_info in files[:3]:  # Limit to first 3 files
                filepath = file_info['path']
                filename = Path(filepath).name
                status = file_info['status']
                
                if status == 'A':
                    changes.append(f"{filename} 파일 추가")
                elif status == 'M':
                    changes.append(f"{filename} 수정")
                elif status == 'D':
                    changes.append(f"{filename} 삭제")
        
        return changes[:5]  # Limit to 5 key changes
    
    def generate_commit_message(self, analysis: Dict, files: List[Dict]) -> str:
        """Generate a commit message following team conventions"""
        commit_type = analysis['suggested_type']
        
        # Generate title
        title = self._generate_title(commit_type, analysis, files)
        
        # Generate body
        body = self._generate_body(analysis, files)
        
        # Format the commit message
        message = f"{commit_type}: {title}\n\n{body}"
        
        return message
    
    def _generate_title(self, commit_type: str, analysis: Dict, files: List[Dict]) -> str:
        """Generate commit title (max 80 characters)"""
        key_changes = analysis['key_changes']
        
        if key_changes:
            title = key_changes[0]
        else:
            # Fallback to generic description
            if analysis['added_files'] > 0:
                title = f"새로운 파일 추가 ({analysis['added_files']}개)"
            elif analysis['modified_files'] > 0:
                title = f"코드 수정 ({analysis['modified_files']}개 파일)"
            else:
                title = "변경사항 적용"
        
        # Ensure title is under 80 characters
        if len(f"{commit_type}: {title}") > 80:
            title = title[:80 - len(commit_type) - 2] + "..."
        
        return title
    
    def _generate_body(self, analysis: Dict, files: List[Dict]) -> str:
        """Generate commit message body"""
        body_lines = []
        
        # Add key changes
        if analysis['key_changes']:
            for change in analysis['key_changes']:
                body_lines.append(f"- {change}")
        
        # Add file statistics if significant
        if analysis['added_files'] > 0:
            body_lines.append(f"- {analysis['added_files']}개 파일 추가")
        if analysis['modified_files'] > 0:
            body_lines.append(f"- {analysis['modified_files']}개 파일 수정")
        if analysis['deleted_files'] > 0:
            body_lines.append(f"- {analysis['deleted_files']}개 파일 삭제")
        
        # Add line statistics if significant
        if analysis['added_lines'] > 10 or analysis['removed_lines'] > 10:
            body_lines.append(f"- +{analysis['added_lines']} -{analysis['removed_lines']} 라인")
        
        return '\n'.join(body_lines) if body_lines else "- 코드 개선"
    
    def interactive_edit(self, message: str) -> str:
        """Allow user to edit the generated message interactively"""
        print("\n" + "=" * 60)
        print("생성된 커밋 메시지:")
        print("=" * 60)
        print(message)
        print("=" * 60)
        print("\n옵션:")
        print("  1. 이 메시지 사용")
        print("  2. 제목만 수정")
        print("  3. 전체 수정")
        print("  4. 취소")
        
        while True:
            choice = input("\n선택 (1-4): ").strip()
            
            if choice == '1':
                return message
            elif choice == '2':
                lines = message.split('\n')
                print(f"\n현재 제목: {lines[0]}")
                new_title = input("새로운 제목 입력: ").strip()
                if new_title:
                    lines[0] = new_title
                    return '\n'.join(lines)
                return message
            elif choice == '3':
                print("\n전체 커밋 메시지를 입력하세요 (빈 줄로 종료):")
                new_lines = []
                while True:
                    line = input()
                    if not line and new_lines:
                        break
                    new_lines.append(line)
                return '\n'.join(new_lines)
            elif choice == '4':
                return None
            else:
                print("잘못된 선택입니다. 1-4 중 선택하세요.")
    
    def commit(self, message: str) -> bool:
        """Create a commit with the given message"""
        success, output = self._run_git_command(['git', 'commit', '-m', message])
        
        if success:
            print("\n✅ 커밋이 성공적으로 생성되었습니다!")
            return True
        else:
            print(f"\n❌ 커밋 실패: {output}")
            return False

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate commit messages following team conventions')
    parser.add_argument('--auto', action='store_true', help='Auto-commit without interactive editing')
    parser.add_argument('--dry-run', action='store_true', help='Generate message without committing')
    parser.add_argument('--repo', default='.', help='Path to git repository')
    
    args = parser.parse_args()
    
    analyzer = CommitAnalyzer(args.repo)
    
    # Get staged changes
    print("🔍 Analyzing staged changes...")
    diff = analyzer.get_staged_diff()
    
    if not diff:
        sys.exit(1)
    
    files = analyzer.get_staged_files()
    print(f"   Found {len(files)} staged file(s)")
    
    # Analyze changes
    analysis = analyzer.analyze_changes(diff, files)
    print(f"   Suggested type: {analysis['suggested_type']}")
    
    # Generate commit message
    message = analyzer.generate_commit_message(analysis, files)
    
    if args.dry_run:
        print("\n생성된 커밋 메시지:")
        print("=" * 60)
        print(message)
        print("=" * 60)
        return
    
    # Interactive editing or auto-commit
    if args.auto:
        final_message = message
    else:
        final_message = analyzer.interactive_edit(message)
    
    if final_message is None:
        print("\n커밋이 취소되었습니다.")
        sys.exit(0)
    
    # Commit
    if not args.dry_run:
        analyzer.commit(final_message)

if __name__ == "__main__":
    main()
