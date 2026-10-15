import 'package:flutter/material.dart';

class Menu1Screen extends StatelessWidget {
  const Menu1Screen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('메뉴1')),
      body: const Center(child: Text('메뉴1 화면')),
    );
  }
}
