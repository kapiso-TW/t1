/* hash 密碼生成 */
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* 解鎖頁面 */
async function unlock() {
    const passwordInput = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    const hashedPassword = await hashPassword(passwordInput);

    // 使用密碼作為名稱
    $(".lock").fadeOut(400, async function () {
        document.getElementById("lock-screen").classList.remove("active");
        document.getElementById("content").classList.add("active");

        // 向伺服器發送名稱
        socket.emit('setNickname', passwordInput);
    });
    await delay(400);
    $(".unlock").fadeIn(400);
}

/* 延遲函數 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 收回訊息
function retractMessage(messageId) {
    socket.emit('retractMessage', messageId);
}

// 監聽錯誤訊息
socket.on('errorMessage', (error) => {
    alert(error); // 顯示錯誤訊息
});
