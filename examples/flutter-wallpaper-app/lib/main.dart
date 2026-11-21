import 'dart:async';
import 'package:flutter/material.dart';
import 'minibase.dart';

void main() {
  runApp(const MiniBaseWallpaperApp());
}

class MiniBaseWallpaperApp extends StatelessWidget {
  const MiniBaseWallpaperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MiniBase Wallpapers',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF8F8F8),
        colorScheme: const ColorScheme.light(
          primary: Colors.black,
          onPrimary: Colors.white,
          secondary: Colors.black,
          surface: Colors.white,
          onSurface: Colors.black,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          scrolledUnderElevation: 0,
          titleTextStyle: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
      ),
      home: const WallpapersHomePage(),
    );
  }
}

class WallpapersHomePage extends StatefulWidget {
  const WallpapersHomePage({super.key});

  @override
  State<WallpapersHomePage> createState() => _WallpapersHomePageState();
}

class _WallpapersHomePageState extends State<WallpapersHomePage> {
  // Active Public Tunnel & Local Wi-Fi URLs
  static const String publicTunnelUrl = 'https://gps-assume-thehun-cord.trycloudflare.com';
  static const String localWifiUrl = 'http://192.168.1.95:8090';
  static const String emulatorUrl = 'http://10.0.2.2:8090';

  String _serverUrl = publicTunnelUrl;
  late MiniBase _mb;

  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  List<dynamic> _wallpapers = [];
  bool _isLoading = false;
  String _selectedCategory = 'all';
  String _searchQuery = '';

  final List<Map<String, dynamic>> _categories = [
    {'id': 'all', 'label': 'ALL'},
    {'id': 'Nature', 'label': 'NATURE'},
    {'id': 'Abstract', 'label': 'ABSTRACT'},
    {'id': 'Architecture', 'label': 'ARCHITECTURE'},
    {'id': 'Minimal', 'label': 'MINIMAL'},
  ];

  @override
  void initState() {
    super.initState();
    _mb = MiniBase(_serverUrl);
    _loadWallpapers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadWallpapers() async {
    setState(() => _isLoading = true);
    try {
      String? filter;
      if (_selectedCategory != 'all') {
        filter = "category = '$_selectedCategory'";
      }

      final res = await _mb.collection('wallpapers').getList(
            page: 1,
            perPage: 60,
            sort: '-created',
            filter: filter,
            search: _searchQuery.isNotEmpty ? _searchQuery : null,
          );

      if (mounted) {
        setState(() {
          _wallpapers = res['items'] ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.black,
            content: Text(
              'Backend Error: $e\nTap settings icon to check server URL.',
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 250), () {
      setState(() {
        _searchQuery = query.trim();
      });
      _loadWallpapers();
    });
  }

  void _onCategorySelected(String categoryId) {
    setState(() {
      _selectedCategory = categoryId;
    });
    _loadWallpapers();
  }

  void _openServerConfigDialog() {
    final urlController = TextEditingController(text: _serverUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
          side: BorderSide(color: Colors.black, width: 2.5),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: const BoxDecoration(
                color: Colors.black,
                boxShadow: [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
              ),
              child: const Icon(Icons.dns_outlined, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            const Text(
              'MINIBASE BACKEND URL',
              style: TextStyle(color: Colors.black, fontSize: 14, fontWeight: FontWeight.w800),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select a preset connection or enter custom URL:',
              style: TextStyle(color: Color(0xFF555555), fontSize: 12, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),

            // Quick Preset Buttons
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildPresetButton('Live Tunnel', publicTunnelUrl, urlController),
                _buildPresetButton('Local Wi-Fi', localWifiUrl, urlController),
                _buildPresetButton('Emulator', emulatorUrl, urlController),
              ],
            ),
            const SizedBox(height: 12),

            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: Colors.black, width: 2),
                boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
              ),
              child: TextField(
                controller: urlController,
                style: const TextStyle(color: Colors.black, fontSize: 12, fontWeight: FontWeight.w700),
                decoration: const InputDecoration(
                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  border: InputBorder.none,
                  hintText: 'http://...',
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL', style: TextStyle(color: Colors.black, fontWeight: FontWeight.w700)),
          ),
          ElevatedButton(
            onPressed: () {
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                setState(() {
                  _serverUrl = newUrl;
                  _mb = MiniBase(_serverUrl);
                });
                _loadWallpapers();
                Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.zero,
                side: BorderSide(color: Colors.black, width: 2),
              ),
              elevation: 0,
            ),
            child: const Text('SAVE & CONNECT', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildPresetButton(String label, String url, TextEditingController controller) {
    return InkWell(
      onTap: () {
        controller.text = url;
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF0F0F0),
          border: Border.all(color: Colors.black, width: 1.5),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Colors.black),
        ),
      ),
    );
  }

  void _openWallpaperPreview(Map<String, dynamic> item) {
    final imgUrl = _mb.getFileUrl('wallpapers', item['id'], item['image'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.88,
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.black, width: 3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black,
              offset: Offset(0, -6),
              blurRadius: 0,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Retro Window Header Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: const BoxDecoration(
                color: Colors.black,
                border: Border(bottom: BorderSide(color: Colors.black, width: 2)),
              ),
              child: Row(
                children: [
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF888888), shape: BoxShape.circle)),
                  const SizedBox(width: 5),
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF888888), shape: BoxShape.circle)),
                  const SizedBox(width: 5),
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF888888), shape: BoxShape.circle)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item['title'] ?? 'WALLPAPER PREVIEW',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                    ),
                  ),
                  InkWell(
                    onTap: () => Navigator.pop(ctx),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(border: Border.all(color: Colors.white)),
                      child: const Text('✕', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),

            // Image Display
            Expanded(
              child: Container(
                color: const Color(0xFF111111),
                child: Image.network(
                  imgUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Center(
                    child: Text('IMAGE FAILED TO LOAD', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.w700)),
                  ),
                ),
              ),
            ),

            // Retro Bottom Meta & Download Action
            Container(
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Colors.black, width: 2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (item['title'] ?? 'Wallpaper').toString().toUpperCase(),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      _buildRetroTag(item['category'] ?? 'NATURE', isInverted: true),
                      _buildRetroTag('ID: ${(item['id'] ?? '').toString().substring(0, 8)}...'),
                      _buildRetroTag('4K ULTRA-HD'),
                      _buildRetroTag('SQLITE WAL'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Download Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        try {
                          final current = item['downloads'] ?? 0;
                          await _mb.collection('wallpapers').update(item['id'], {'downloads': current + 1});
                          setState(() {
                            item['downloads'] = current + 1;
                          });
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: Colors.black,
                                content: Text(
                                  '✓ Download recorded in MiniBase database!',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                                ),
                              ),
                            );
                          }
                        } catch (_) {}
                      },
                      icon: const Icon(Icons.download_rounded, size: 18),
                      label: Text(
                        'DOWNLOAD WALLPAPER (${item['downloads'] ?? 0})',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                          side: BorderSide(color: Colors.black, width: 2),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRetroTag(String text, {bool isInverted = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isInverted ? Colors.black : Colors.white,
        border: Border.all(color: Colors.black, width: 1.5),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: isInverted ? Colors.white : Colors.black,
          letterSpacing: 0.4,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: const BoxDecoration(
                color: Colors.black,
                boxShadow: [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
              ),
              child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 10),
            const Text('MINIBASE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17, letterSpacing: -0.5)),
            const SizedBox(width: 4),
            const Text('// WALLPAPERS', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF666666))),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(2.5),
          child: Container(color: Colors.black, height: 2.5),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, size: 20, color: Colors.black),
            tooltip: 'Server Connection',
            onPressed: _openServerConfigDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20, color: Colors.black),
            tooltip: 'Reload',
            onPressed: _loadWallpapers,
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: Column(
        children: [
          // Live Retro Telemetry Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: const BoxDecoration(
              color: Colors.black,
              border: Border(bottom: BorderSide(color: Colors.black, width: 2)),
            ),
            child: Row(
              children: [
                Container(
                  width: 7,
                  height: 7,
                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                ),
                const SizedBox(width: 6),
                const Text(
                  'SQLITE WAL',
                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                ),
                const Spacer(),
                Text(
                  'RECORDS: ${_wallpapers.length}',
                  style: const TextStyle(color: Color(0xFFCCCCCC), fontSize: 10, fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 8),
                const Text('|', style: TextStyle(color: Color(0xFF555555), fontSize: 10)),
                const SizedBox(width: 8),
                const Text(
                  'LATENCY: <0.15ms',
                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),

          // Live Retro Search Box
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 10),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: Colors.black, width: 2.2),
                boxShadow: const [
                  BoxShadow(color: Colors.black, offset: Offset(3, 3), blurRadius: 0),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                style: const TextStyle(fontSize: 13, color: Colors.black, fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  hintText: 'SEARCH WALLPAPERS...',
                  hintStyle: const TextStyle(color: Color(0xFF888888), fontSize: 12, fontWeight: FontWeight.w700),
                  prefixIcon: const Icon(Icons.search_rounded, color: Colors.black, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close_rounded, size: 18, color: Colors.black),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                ),
              ),
            ),
          ),

          // Horizontal Retro Category Chips
          SizedBox(
            height: 36,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              scrollDirection: Axis.horizontal,
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 7),
              itemBuilder: (context, idx) {
                final cat = _categories[idx];
                final isSelected = _selectedCategory == cat['id'];
                return InkWell(
                  onTap: () => _onCategorySelected(cat['id']),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.black : Colors.white,
                      border: Border.all(color: Colors.black, width: 2),
                      boxShadow: isSelected
                          ? const [BoxShadow(color: Color(0xFF666666), offset: Offset(2, 2))]
                          : const [BoxShadow(color: Colors.black, offset: Offset(2, 2))],
                    ),
                    child: Center(
                      child: Text(
                        cat['label'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : Colors.black,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          // Wallpapers Grid
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.black, strokeWidth: 3),
                  )
                : _wallpapers.isEmpty
                    ? Center(
                        child: Container(
                          margin: const EdgeInsets.all(24),
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border.all(color: Colors.black, width: 2.2),
                            boxShadow: const [BoxShadow(color: Colors.black, offset: Offset(4, 4))],
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.search_off_rounded, size: 40, color: Colors.black),
                              const SizedBox(height: 12),
                              const Text(
                                'NO WALLPAPERS FOUND',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _searchQuery.isNotEmpty
                                    ? 'No record matched "$_searchQuery"'
                                    : 'No wallpapers available in this category.',
                                style: const TextStyle(color: Color(0xFF666666), fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadWallpapers,
                        color: Colors.black,
                        backgroundColor: Colors.white,
                        child: GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 14,
                            childAspectRatio: 0.64,
                          ),
                          itemCount: _wallpapers.length,
                          itemBuilder: (context, idx) {
                            final item = _wallpapers[idx];
                            final imgUrl = _mb.getFileUrl('wallpapers', item['id'], item['image'] ?? '');

                            return GestureDetector(
                              onTap: () => _openWallpaperPreview(item),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  border: Border.all(color: Colors.black, width: 2.2),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Colors.black,
                                      offset: Offset(3.5, 3.5),
                                      blurRadius: 0,
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    // Top Bar
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                      color: Colors.black,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Row(
                                            children: [
                                              Container(width: 5, height: 5, decoration: const BoxDecoration(color: Color(0xFF777777), shape: BoxShape.circle)),
                                              const SizedBox(width: 3),
                                              Container(width: 5, height: 5, decoration: const BoxDecoration(color: Color(0xFF777777), shape: BoxShape.circle)),
                                            ],
                                          ),
                                          Text(
                                            (item['category'] ?? 'NATURE').toString().toUpperCase(),
                                            style: const TextStyle(fontSize: 8.5, color: Colors.white, fontWeight: FontWeight.w800),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Image
                                    Expanded(
                                      child: Container(
                                        color: const Color(0xFF111111),
                                        child: Image.network(
                                          imgUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const Center(
                                            child: Icon(Icons.broken_image_outlined, color: Colors.white30, size: 28),
                                          ),
                                        ),
                                      ),
                                    ),

                                    // Bottom Details
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        border: Border(top: BorderSide(color: Colors.black, width: 1.5)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item['title'] ?? 'Wallpaper',
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                              fontSize: 12,
                                              color: Colors.black,
                                            ),
                                          ),
                                          const SizedBox(height: 3),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                'ID: ${(item['id'] ?? '').toString().substring(0, 5)}..',
                                                style: const TextStyle(fontSize: 9.5, color: Color(0xFF777777), fontWeight: FontWeight.w700),
                                              ),
                                              Row(
                                                children: [
                                                  const Icon(Icons.download_rounded, size: 11, color: Colors.black),
                                                  const SizedBox(width: 2),
                                                  Text(
                                                    '${item['downloads'] ?? 0}',
                                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.black),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
