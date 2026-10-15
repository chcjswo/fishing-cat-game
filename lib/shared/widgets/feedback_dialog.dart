import 'package:flutter/material.dart';

class FeedbackDialog extends StatefulWidget {
  const FeedbackDialog({super.key});

  static Future<Map<String, String>?> show(BuildContext context) {
    return showDialog<Map<String, String>>(
      context: context,
      builder: (context) => const FeedbackDialog(),
    );
  }

  @override
  State<FeedbackDialog> createState() => _FeedbackDialogState();
}

class _FeedbackDialogState extends State<FeedbackDialog> {
  int _currentStep = 0;
  String _category = '기능 제안';
  String? _messageError;
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  // 타이틀 가져오기
  String _getTitle() {
    switch (_currentStep) {
      case 0:
        return '문의 유형';
      case 1:
        return '내용 입력';
      default:
        return '';
    }
  }

  // // 컨텐츠 가져오기
  Widget _buildContent() {
    switch (_currentStep) {
      case 0:
        return _buildCategoryStepContent();
      case 1:
        return _buildMessageStepContent();
      default:
        return const SizedBox();
    }
  }

  Widget _buildCategoryStepContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.lightbulb_outline),
          title: const Text('기능 제안'),
          subtitle: const Text('원하는 기능을 말씀해주세요'),
          onTap: () {
            setState(() {
              _category = '기능 제안';
              _currentStep++;
            });
          },
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.bug_report_outlined),
          title: const Text('버그 신고'),
          subtitle: const Text('불편한 점을 말씀해주세요'),
          onTap: () {
            setState(() {
              _category = '버그 신고';
              _currentStep++;
            });
          },
        ),
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.question_mark_outlined),
          title: const Text('기타 문의'),
          subtitle: const Text('궁금한 점을 말씀해주세요'),
          onTap: () {
            setState(() {
              _category = '기타 문의';
              _currentStep++;
            });
          },
        ),
      ],
    );
  }

  Widget _buildMessageStepContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        TextField(
          controller: _messageController,
          autofocus: true,
          maxLength: 300,
          maxLines: 4,
          keyboardType: TextInputType.multiline,
          decoration: InputDecoration(
            hintText:
                '예시) 앱을 실행하면 화면이 깜빡이고 검은 화면이 나타납니다. 앱을 재시작해도 동일한 문제가 발생합니다.',
            errorText: _messageError,
          ),
        ),
      ],
    );
  }


  // // 액션 가져오기
  List<Widget> _buildActions() {
    switch (_currentStep) {
      case 0:
        return _buildCategoryStepActions();
      case 1:
        return _buildMessageStepActions();
      default:
        return [];
    }
  }

  List<Widget> _buildCategoryStepActions() {
    return [
      TextButton(
        onPressed: () => Navigator.pop(context),
        style: TextButton.styleFrom(
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            inherit: false,
          ),
        ),
        child: const Text('닫기'),
      ),
    ];
  }

  List<Widget> _buildMessageStepActions() {
    return [
      TextButton(
        onPressed: () => setState(() {
          _currentStep--;
        }),
        style: TextButton.styleFrom(
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            inherit: false,
          ),
        ),
        child: const Text('이전'),
      ),
      TextButton(
        onPressed: () {
          final message = _messageController.text.trim();
          if (message.length < 5) {
            setState(() {
              _messageError = '5자 이상 입력해주세요';
            });
            return;
          }
          setState(() {
            _messageError = null;
          });
          Navigator.pop(context, {
            'category': _category,
            'message': message,
            'email': '',
          });
        },
        style: TextButton.styleFrom(
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            inherit: false,
          ),
        ),
        child: const Text('제출'),
      ),
    ];
  }


  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: BorderSide(
          color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      title: Text(_getTitle()),
      content: _buildContent(),
      actions: _buildActions(),
    );
  }
}
