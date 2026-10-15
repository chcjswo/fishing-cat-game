import 'package:flutter/material.dart';

class Menu2Screen extends StatelessWidget {
  const Menu2Screen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('메뉴2')),
      body: const Center(child: Text('메뉴2 화면')),
    );
  }
}
