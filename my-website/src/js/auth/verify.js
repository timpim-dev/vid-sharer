document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const statusElement = document.getElementById('verification-status');
    const actionButtons = document.getElementById('action-buttons');

    if (!token) {
        statusElement.textContent = 'Invalid verification link';
        statusElement.classList.add('error');
        return;
    }

    try {
        const auth = new Auth();
        const result = await auth.verifyEmail(token);
        
        if (result.success) {
            statusElement.textContent = 'Email verified successfully!';
            statusElement.classList.add('success');
            actionButtons.classList.remove('hidden');
        } else {
            statusElement.textContent = result.message;
            statusElement.classList.add('error');
        }
    } catch (error) {
        statusElement.textContent = 'Verification failed. Please try again.';
        statusElement.classList.add('error');
    }
});