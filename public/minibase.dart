import 'dart:convert';
import 'package:http/http.dart' as http;

/// ⚡ MiniBase Flutter / Dart Client SDK
/// Ultra-lightweight, zero-config client for MiniBase Backend-as-a-Service.
class MiniBase {
  final String baseUrl;
  String? token;
  Map<String, dynamic>? authModel;

  MiniBase(String url)
      : baseUrl = url.replaceAll(RegExp(r'/+$'), '').replaceAll(RegExp(r'/minibase$'), '');

  /// Access a collection by name
  MiniBaseCollection collection(String name) => MiniBaseCollection(this, name);

  /// Get file / media URL
  String getFileUrl(String collectionName, String recordId, String filename, {String? thumb}) {
    final thumbParam = thumb != null ? '?thumb=$thumb' : '';
    return '$baseUrl/api/files/$collectionName/$recordId/$filename$thumbParam';
  }
}

class MiniBaseCollection {
  final MiniBase client;
  final String name;

  MiniBaseCollection(this.client, this.name);

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        if (client.token != null) 'Authorization': 'Bearer ${client.token}',
      };

  /// Fetch list of records
  Future<Map<String, dynamic>> getList({
    int page = 1,
    int perPage = 30,
    String? filter,
    String? sort,
    String? search,
    String? expand,
  }) async {
    final queryParams = {
      'page': '$page',
      'perPage': '$perPage',
      if (filter != null) 'filter': filter,
      if (sort != null) 'sort': sort,
      if (search != null) 'search': search,
      if (expand != null) 'expand': expand,
    };

    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/records')
        .replace(queryParameters: queryParams);

    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body);
    }
    throw Exception('MiniBase Error (${res.statusCode}): ${res.body}');
  }

  /// Get single record by ID
  Future<Map<String, dynamic>> getOne(String id, {String? expand}) async {
    final queryParams = {if (expand != null) 'expand': expand};
    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/records/$id')
        .replace(queryParameters: queryParams);

    final res = await http.get(uri, headers: _headers);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body);
    }
    throw Exception('MiniBase Error (${res.statusCode}): ${res.body}');
  }

  /// Create new record
  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async {
    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/records');
    final res = await http.post(uri, headers: _headers, body: jsonEncode(body));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body);
    }
    throw Exception('MiniBase Error (${res.statusCode}): ${res.body}');
  }

  /// Update existing record
  Future<Map<String, dynamic>> update(String id, Map<String, dynamic> body) async {
    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/records/$id');
    final res = await http.patch(uri, headers: _headers, body: jsonEncode(body));
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return jsonDecode(res.body);
    }
    throw Exception('MiniBase Error (${res.statusCode}): ${res.body}');
  }

  /// Delete record
  Future<bool> delete(String id) async {
    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/records/$id');
    final res = await http.delete(uri, headers: _headers);
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  /// Auth with email/identity and password
  Future<Map<String, dynamic>> authWithPassword(String identity, String password) async {
    final uri = Uri.parse('${client.baseUrl}/api/collections/$name/auth-with-password');
    final res = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode({'identity': identity, 'password': password}),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      client.token = data['token'];
      client.authModel = data['record'];
      return data;
    }
    throw Exception('MiniBase Auth Error (${res.statusCode}): ${res.body}');
  }
}
