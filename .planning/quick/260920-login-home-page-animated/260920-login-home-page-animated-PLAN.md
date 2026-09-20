# Quick Plan: Animated Login Home Page with Logo and Presets Removal

## Goal
Add a dedicated animated login home page featuring `pictures/logo.png`, the "Housing Application" brand title, and login credentials form, while completely removing user preset buttons and providing an engaging, entertaining visual experience.

## Tasks
1. **Asset Placement**:
   - Create `pictures/` directory in `src/HousingApplication.Web/wwwroot/pictures/` and `dist/win-x64/wwwroot/pictures/`.
   - Copy `logo.png` from root to both `pictures/` directories.

2. **Login Home Page & Animations**:
   - Redesign `#login-screen` in `src/HousingApplication.Web/wwwroot/index.html` to be a full-screen animated Login Home Page that appears first when unauthenticated.
   - Remove user presets section (`login-presets-container` and user chips).
   - Display `pictures/logo.png` with glowing halo, floating animation, and "Housing Application" title.
   - Add engaging CSS animations (floating orbs, glowing aura, glassmorphic card, input focus effects) in `src/HousingApplication.Web/wwwroot/css/styles.css`.

3. **AuthManager Update & Dual-Asset Parity**:
   - In `src/HousingApplication.Web/wwwroot/js/auth-manager.js`, ensure clean operation with presets removed.
   - Show login home page on initial load if unauthenticated, and on logout.
   - Copy updated files to `dist/win-x64/wwwroot/`.

4. **Testing**:
   - Update `tests/web/components/auth_manager.test.js` to reflect presets removal and verify the login home page with logo and "Housing Application" text.
   - Run Vitest test suite to verify 100% pass rate.
