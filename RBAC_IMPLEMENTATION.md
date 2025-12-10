# Role-Based Access Control (RBAC) Implementation

## Overview
Sistem ini mengimplementasikan kontrol akses berbasis peran (RBAC) untuk membedakan antara **Admin** dan **Cashier** dengan akses yang berbeda ke fitur-fitur tertentu.

## Struktur Akses

### Admin - Akses Penuh
Admin dapat mengakses semua halaman:
- ✅ Dashboard
- ✅ Products
- ✅ Point of Sale (POS)
- ✅ Reports
- ✅ Raw Materials
- ✅ Purchases
- ✅ Settings

### Cashier - Akses Terbatas
Cashier hanya dapat mengakses 4 halaman:
- ✅ Dashboard
- ✅ Products
- ✅ Point of Sale (POS)
- ✅ Settings

Cashier **tidak dapat mengakses**:
- ❌ Reports
- ❌ Raw Materials
- ❌ Purchases

## File-file yang Dimodifikasi

### 1. `/src/utils/permissions.ts` (BARU)
- Mendefinisikan `rolePermissions` yang memetakan setiap role dengan route yang diizinkan
- Menyediakan fungsi `canAccessRoute()` untuk mengecek akses
- Menyediakan fungsi `getAllowedNavItems()` untuk mendapatkan menu items sesuai role

### 2. `/src/components/ProtectedRoute.tsx` (BARU)
- Component wrapper untuk route yang memerlukan proteksi
- Mengecek apakah user memiliki akses ke route yang diminta
- Redirect ke dashboard jika user tidak memiliki akses

### 3. `/src/routes/AppRoutes.tsx` (DIMODIFIKASI)
- Membungkus setiap route dengan `<ProtectedRoute>`
- Routes yang `allowedRoles={['admin']}` hanya bisa diakses admin:
  - Reports
  - Raw Materials
  - Purchases
- Routes tanpa `allowedRoles` bisa diakses kedua role (admin & cashier):
  - Dashboard
  - Products
  - POS
  - Settings

### 4. `/src/components/navigation/Sidebar.tsx` (DIMODIFIKASI)
- Filter menu items berdasarkan `rolePermissions`
- Tampilkan role user di sidebar
- Hanya menu yang diizinkan akan ditampilkan sesuai role

### 5. `/src/context/AuthContext.tsx` (SUDAH ADA)
- Sudah memiliki struktur untuk menampung `user.role`
- Sudah memiliki helper `isAdmin` dan `isCashier`
- Backend sudah mengirimkan `role` dalam JWT token

## Cara Kerja

### Alur Login
1. User login dengan email dan password
2. Backend (`/auth/login`) memvalidasi kredensial
3. Backend mengirimkan response dengan:
   - `user` object (termasuk `role`: 'admin' atau 'cashier')
   - JWT `token` (berisi payload dengan role)
4. Frontend menyimpan token dan user data di context
5. Sidebar otomatis menampilkan menu sesuai role user

### Alur Akses Route
1. User mencoba mengakses suatu route
2. `ProtectedRoute` component mengecek:
   - Apakah user sudah login?
   - Apakah user memiliki akses ke route ini?
3. Jika tidak memiliki akses → redirect ke `/dashboard`
4. Jika ada akses → tampilkan halaman

## Testing

### Test sebagai Admin
1. Login dengan akun admin
2. Sidebar akan menampilkan 7 menu items (semua)
3. Bisa akses semua route tanpa masalah

### Test sebagai Cashier
1. Login dengan akun cashier
2. Sidebar hanya menampilkan 4 menu items:
   - Dashboard
   - Products
   - Point of Sale
   - Settings
3. Jika cashier mencoba akses Reports/Raw Materials/Purchases:
   - Langsung redirect ke Dashboard
   - Menu item tidak ditampilkan di sidebar

## Menambah/Mengubah Permission

Jika ingin menambah atau mengubah permission:

1. **Edit `/src/utils/permissions.ts`**
   ```typescript
   export const rolePermissions: Record<UserRole, string[]> = {
     admin: [
       // tambah/hapus route di sini
     ],
     cashier: [
       // tambah/hapus route di sini
     ],
   };
   ```

2. **Edit `/src/routes/AppRoutes.tsx`**
   ```typescript
   // Untuk route yang hanya admin bisa akses
   <Route 
     path="new-feature" 
     element={
       <ProtectedRoute allowedRoles={['admin']}>
         <NewFeature />
       </ProtectedRoute>
     } 
   />

   // Untuk route yang kedua role bisa akses
   <Route 
     path="shared-feature" 
     element={
       <ProtectedRoute>
         <SharedFeature />
       </ProtectedRoute>
     } 
   />
   ```

3. Route akan otomatis muncul/hilang di sidebar

## Keamanan Backend

⚠️ **PENTING**: Pastikan backend juga mengecek role untuk setiap API endpoint!

Contoh untuk endpoint yang hanya admin bisa akses:
```javascript
// Middleware untuk cek admin
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Gunakan di route
router.get('/admin-only-endpoint', requireAdmin, (req, res) => {
  // ...
});
```

## Summary

✅ Sekarang Cashier hanya bisa akses: **Dashboard, Products, POS, Settings**
✅ Admin bisa akses: **Semua halaman**
✅ Menu di sidebar otomatis tersembunyi sesuai role
✅ Route protection di frontend
✅ Backend sudah mengirimkan role di JWT
