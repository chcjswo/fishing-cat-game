#!/usr/bin/env python3
"""
Flutter Performance Analyzer
Analyzes Flutter projects for common performance issues and optimization opportunities.
"""

import os
import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from collections import defaultdict

class FlutterAnalyzer:
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.lib_path = self.project_path / "lib"
        self.issues = defaultdict(list)
        
        # Priority levels (1=highest, 3=lowest)
        self.priorities = {
            "memory_leak": 1,
            "excessive_rebuild": 1,
            "inefficient_list": 2,
            "heavy_ui_thread": 1,
            "unoptimized_image": 2,
            "unnecessary_package": 3,
            "state_management": 2,
            "missing_const": 3
        }
    
    def analyze(self) -> Dict:
        """Run all analysis checks"""
        if not self.lib_path.exists():
            return {"error": "lib directory not found"}
        
        dart_files = list(self.lib_path.rglob("*.dart"))
        
        for file_path in dart_files:
            content = file_path.read_text(encoding='utf-8')
            rel_path = file_path.relative_to(self.project_path)
            
            self.check_memory_leaks(content, rel_path)
            self.check_excessive_rebuilds(content, rel_path)
            self.check_inefficient_lists(content, rel_path)
            self.check_heavy_ui_operations(content, rel_path)
            self.check_unoptimized_images(content, rel_path)
            self.check_state_management(content, rel_path)
            self.check_missing_const(content, rel_path)
        
        self.check_unnecessary_packages()
        
        return self.get_results()
    
    def check_memory_leaks(self, content: str, file_path: Path):
        """Check for potential memory leaks"""
        lines = content.split('\n')
        
        # Check for StreamController without close
        has_stream_controller = False
        has_close_method = False
        
        for i, line in enumerate(lines, 1):
            if 'StreamController' in line and not line.strip().startswith('//'):
                has_stream_controller = True
            if 'dispose()' in line or '.close()' in line:
                has_close_method = True
        
        if has_stream_controller and not has_close_method:
            self.issues["memory_leak"].append({
                "file": str(file_path),
                "line": None,
                "message": "StreamController detected without explicit close/dispose",
                "severity": "high"
            })
        
        # Check for Timer without cancel
        has_timer = False
        has_cancel = False
        
        for i, line in enumerate(lines, 1):
            if re.search(r'Timer\.(periodic|new)', line) and not line.strip().startswith('//'):
                has_timer = True
            if '.cancel()' in line or 'dispose()' in line:
                has_cancel = True
        
        if has_timer and not has_cancel:
            self.issues["memory_leak"].append({
                "file": str(file_path),
                "line": None,
                "message": "Timer detected without explicit cancel in dispose",
                "severity": "high"
            })
        
        # Check for AnimationController without dispose
        for i, line in enumerate(lines, 1):
            if 'AnimationController' in line and 'vsync' in line and not line.strip().startswith('//'):
                # Check if dispose is called in the class
                if 'dispose()' not in content:
                    self.issues["memory_leak"].append({
                        "file": str(file_path),
                        "line": i,
                        "message": "AnimationController without dispose method",
                        "severity": "high"
                    })
                    break
    
    def check_excessive_rebuilds(self, content: str, file_path: Path):
        """Check for patterns that cause excessive rebuilds"""
        lines = content.split('\n')
        
        # Check for setState in build method
        in_build_method = False
        for i, line in enumerate(lines, 1):
            if re.search(r'Widget\s+build\s*\(', line):
                in_build_method = True
            elif re.search(r'^\s*\}', line) and in_build_method:
                in_build_method = False
            
            if in_build_method and 'setState' in line and not line.strip().startswith('//'):
                self.issues["excessive_rebuild"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "setState called within build method - causes infinite rebuild loop",
                    "severity": "critical"
                })
        
        # Check for Provider.of without listen: false in build
        for i, line in enumerate(lines, 1):
            if 'Provider.of' in line and 'listen: false' not in line and not line.strip().startswith('//'):
                self.issues["excessive_rebuild"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "Provider.of without listen: false may cause unnecessary rebuilds",
                    "severity": "medium"
                })
        
        # Check for missing Builder widgets
        if 'StatefulWidget' in content or 'StatelessWidget' in content:
            if content.count('setState') > 5 and 'Builder' not in content:
                self.issues["excessive_rebuild"].append({
                    "file": str(file_path),
                    "line": None,
                    "message": "Multiple setState calls without Builder widgets - consider splitting widgets",
                    "severity": "medium"
                })
    
    def check_inefficient_lists(self, content: str, file_path: Path):
        """Check for inefficient list rendering"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for ListView without builder
            if re.search(r'ListView\s*\(', line) and 'children:' in content and not line.strip().startswith('//'):
                self.issues["inefficient_list"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "ListView with children list - use ListView.builder for better performance",
                    "severity": "medium"
                })
            
            # Check for Column/Row with many children
            if re.search(r'(Column|Row)\s*\(', line):
                # Count children in this Column/Row
                remaining = content[content.find(line):]
                children_match = re.search(r'children:\s*\[([^\]]*)\]', remaining, re.DOTALL)
                if children_match:
                    children_count = children_match.group(1).count('Widget') + children_match.group(1).count('Container')
                    if children_count > 10:
                        self.issues["inefficient_list"].append({
                            "file": str(file_path),
                            "line": i,
                            "message": f"Column/Row with many children ({children_count}+) - consider ListView.builder",
                            "severity": "medium"
                        })
    
    def check_heavy_ui_operations(self, content: str, file_path: Path):
        """Check for heavy operations on UI thread"""
        lines = content.split('\n')
        
        # Check for JSON decode without compute
        for i, line in enumerate(lines, 1):
            if 'jsonDecode' in line and 'compute' not in content and not line.strip().startswith('//'):
                self.issues["heavy_ui_thread"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "jsonDecode without compute - may block UI for large JSON",
                    "severity": "high"
                })
        
        # Check for heavy operations in build
        in_build_method = False
        for i, line in enumerate(lines, 1):
            if re.search(r'Widget\s+build\s*\(', line):
                in_build_method = True
            elif re.search(r'^\s*\}', line) and in_build_method:
                in_build_method = False
            
            if in_build_method:
                # Check for sort/filter in build
                if any(op in line for op in ['.sort(', '.where(', '.map(']) and not line.strip().startswith('//'):
                    self.issues["heavy_ui_thread"].append({
                        "file": str(file_path),
                        "line": i,
                        "message": "Collection operations in build method - move to didChangeDependencies or use cached values",
                        "severity": "medium"
                    })
        
        # Check for File I/O without async
        for i, line in enumerate(lines, 1):
            if re.search(r'File\(.*\)\.readAsStringSync|\.writeAsStringSync', line) and not line.strip().startswith('//'):
                self.issues["heavy_ui_thread"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "Synchronous file I/O - use async methods to avoid blocking UI",
                    "severity": "high"
                })
    
    def check_unoptimized_images(self, content: str, file_path: Path):
        """Check for unoptimized image usage"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for Image without cacheHeight/cacheWidth
            if 'Image.network' in line or 'Image.asset' in line:
                if 'cacheHeight' not in line and 'cacheWidth' not in line and not line.strip().startswith('//'):
                    self.issues["unoptimized_image"].append({
                        "file": str(file_path),
                        "line": i,
                        "message": "Image without cacheHeight/cacheWidth - may load full resolution unnecessarily",
                        "severity": "medium"
                    })
            
            # Check for DecorationImage without fit
            if 'DecorationImage' in line and 'fit:' not in line and not line.strip().startswith('//'):
                self.issues["unoptimized_image"].append({
                    "file": str(file_path),
                    "line": i,
                    "message": "DecorationImage without BoxFit - may cause scaling issues",
                    "severity": "low"
                })
    
    def check_unnecessary_packages(self):
        """Check for unused packages in pubspec.yaml"""
        pubspec_path = self.project_path / "pubspec.yaml"
        if not pubspec_path.exists():
            return
        
        pubspec_content = pubspec_path.read_text()
        
        # Extract dependencies
        dependencies = []
        in_deps = False
        for line in pubspec_content.split('\n'):
            if line.startswith('dependencies:'):
                in_deps = True
                continue
            elif line.startswith('dev_dependencies:'):
                break
            elif in_deps and line.strip() and not line.startswith(' '):
                break
            elif in_deps and ':' in line:
                pkg_name = line.split(':')[0].strip()
                if pkg_name and not pkg_name.startswith('#'):
                    dependencies.append(pkg_name)
        
        # Check if packages are actually imported
        all_dart_content = ""
        for dart_file in self.lib_path.rglob("*.dart"):
            all_dart_content += dart_file.read_text() + "\n"
        
        unused_packages = []
        for pkg in dependencies:
            if pkg in ['flutter', 'cupertino_icons']:  # Skip framework packages
                continue
            # Convert package name to import format (e.g., 'http' -> "package:http/")
            if f"package:{pkg}/" not in all_dart_content and f"import '{pkg}" not in all_dart_content:
                unused_packages.append(pkg)
        
        if unused_packages:
            self.issues["unnecessary_package"].append({
                "file": "pubspec.yaml",
                "line": None,
                "message": f"Potentially unused packages: {', '.join(unused_packages)}",
                "severity": "low"
            })
    
    def check_state_management(self, content: str, file_path: Path):
        """Check for state management anti-patterns"""
        lines = content.split('\n')
        
        # Check for global variables
        for i, line in enumerate(lines, 1):
            if re.match(r'^(?!class|import|export).*\b(var|final|const)\s+\w+\s*=', line.strip()):
                if not line.strip().startswith('//'):
                    self.issues["state_management"].append({
                        "file": str(file_path),
                        "line": i,
                        "message": "Global variable detected - consider using state management solution",
                        "severity": "medium"
                    })
        
        # Check for excessive setState
        setstate_count = content.count('setState')
        if setstate_count > 10:
            self.issues["state_management"].append({
                "file": str(file_path),
                "line": None,
                "message": f"Excessive setState calls ({setstate_count}) - consider using Provider/Riverpod/Bloc",
                "severity": "medium"
            })
        
        # Check for context usage after async
        for i, line in enumerate(lines, 1):
            if 'await' in line and not line.strip().startswith('//'):
                # Check next few lines for context usage
                for j in range(i, min(i+5, len(lines))):
                    if 'context.' in lines[j] or 'BuildContext' in lines[j]:
                        if 'mounted' not in '\n'.join(lines[i:j+1]):
                            self.issues["state_management"].append({
                                "file": str(file_path),
                                "line": j+1,
                                "message": "Context used after async without mounted check - may cause errors",
                                "severity": "high"
                            })
                            break
    
    def check_missing_const(self, content: str, file_path: Path):
        """Check for missing const constructors"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Check for widget instantiation without const
            widget_pattern = r'^\s*(Text|Icon|Padding|SizedBox|Divider|Container)\s*\('
            if re.search(widget_pattern, line) and not 'const' in line and not line.strip().startswith('//'):
                # Make sure it's not a variable or method call
                if '=' not in line.split('(')[0]:
                    self.issues["missing_const"].append({
                        "file": str(file_path),
                        "line": i,
                        "message": f"Widget without const - add const for better performance",
                        "severity": "low"
                    })
    
    def get_results(self) -> Dict:
        """Get analysis results sorted by priority"""
        results = {
            "summary": {
                "total_issues": sum(len(issues) for issues in self.issues.values()),
                "by_category": {cat: len(issues) for cat, issues in self.issues.items()}
            },
            "issues_by_priority": {
                "high": [],
                "medium": [],
                "low": []
            }
        }
        
        # Sort issues by priority
        for category, issues in self.issues.items():
            priority = self.priorities.get(category, 3)
            
            for issue in issues:
                issue["category"] = category
                issue["priority"] = priority
                
                if priority == 1:
                    results["issues_by_priority"]["high"].append(issue)
                elif priority == 2:
                    results["issues_by_priority"]["medium"].append(issue)
                else:
                    results["issues_by_priority"]["low"].append(issue)
        
        return results

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyzer.py <flutter_project_path>")
        sys.exit(1)
    
    project_path = sys.argv[1]
    analyzer = FlutterAnalyzer(project_path)
    results = analyzer.analyze()
    
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
