# 📱 MiniBase Flutter Wallpaper App Example

A beautiful Flutter mobile app powered by **MiniBase** backend.

---

## 🚀 1-Step Setup

1. Make sure MiniBase is running locally:
   ```bash
   node bin/minibase.js serve
   ```

2. Add dependencies in your `pubspec.yaml`:
   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     http: ^1.2.0
   ```

3. Copy `minibase.dart` into your `lib/` directory:
   ```dart
   import 'minibase.dart';

   // Android Emulator uses 10.0.2.2, Physical device uses your local IP, Web/Desktop uses localhost
   final mb = MiniBase('http://10.0.2.2:8090');
   ```

---

## ⚡ MiniBase Flutter SDK Cheat Sheet

### 1. Fetch List of Records
```dart
final res = await mb.collection('wallpapers').getList(
  page: 1,
  perPage: 30,
  sort: '-created',
  filter: "category = 'Nature'",
  search: 'sunset',
);

List<dynamic> items = res['items'];
print('Wallpapers: $items');
```

### 2. Fetch Single Record by ID
```dart
final record = await mb.collection('wallpapers').getOne('RECORD_ID');
print('Record: $record');
```

### 3. Create Record
```dart
final newRecord = await mb.collection('wallpapers').create({
  'title': 'Neon City',
  'category': 'Cyberpunk',
  'downloads': 0,
});
print('Created ID: ${newRecord['id']}');
```

### 4. Update Record
```dart
final updated = await mb.collection('wallpapers').update('RECORD_ID', {
  'downloads': 42,
});
```

### 5. Delete Record
```dart
final deleted = await mb.collection('wallpapers').delete('RECORD_ID');
```

### 6. Get Image / File URL
```dart
final imgUrl = mb.getFileUrl('wallpapers', record['id'], record['image']);
// Use with Image.network(imgUrl)
```

### 7. User Authentication
```dart
final auth = await mb.collection('users').authWithPassword('user@example.com', 'password123');
print('Token: ${auth['token']}');
print('User: ${auth['record']}');
```
