document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const uploadBtn = document.querySelector('.upload-btn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    const formData = new FormData();
    formData.append('title', document.getElementById('video-title').value);
    formData.append('channelName', document.getElementById('channel-name').value);
    formData.append('video', document.getElementById('video-file').files[0]);
    formData.append('logo', document.getElementById('channel-logo').files[0]);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            alert('Upload complete! Redirecting to home page...');
            window.location.href = 'index.html';
        } else {
            alert('Upload failed: ' + result.message);
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Video';
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Video';
    }
});