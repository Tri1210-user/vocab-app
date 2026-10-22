const { execSync } = require('child_process');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

function run(cmd) {
  return execSync(cmd, { cwd: repoDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

try {
  console.log('[Sync] Kiểm tra trạng thái Git trước khi thay đổi code...');
  const status = run('git status --porcelain');
  
  if (status) {
    console.log('[Sync] Phát hiện thay đổi chưa commit. Đang commit code hiện tại...');
    run('git add -A');
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    run(`git commit -m "checkpoint: lưu trạng thái code trước khi chỉnh sửa (${timestamp})"`);
    console.log('[Sync] Đang đẩy lên GitHub...');
    run('git push origin main');
    console.log('[Sync] ✅ Đã lưu và đẩy code hiện tại lên GitHub thành công!');
  } else {
    // Check if branch is ahead of remote
    const ahead = run('git rev-list --count origin/main..HEAD');
    if (parseInt(ahead, 10) > 0) {
      console.log(`[Sync] Phát hiện ${ahead} commit chưa đẩy lên GitHub. Đang đẩy...`);
      run('git push origin main');
      console.log('[Sync] ✅ Đã đẩy toàn bộ commit lên GitHub!');
    } else {
      console.log('[Sync] ✅ Trạng thái kho lưu trữ sạch và đã đồng bộ 100% với GitHub.');
    }
  }
} catch (err) {
  console.error('[Sync Error]', err.message);
  process.exit(1);
}
