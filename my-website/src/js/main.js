let videoInteractions;

async function loadVideos() {
    try {
        const response = await fetch('http://localhost:3000/videos');
        const videos = await response.json();
        
        const videoSelect = document.getElementById('video-chooser');
        videoSelect.innerHTML = '<option value="">Select a video to play</option>';
        
        videos.forEach(video => {
            const option = document.createElement('option');
            option.value = video.path;
            option.textContent = video.title;
            videoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

document.getElementById('video-chooser').addEventListener('change', function(e) {
    const videoPath = this.value;
    if (videoPath) {
        const videoPlayer = document.getElementById('video-player');
        videoPlayer.src = `http://localhost:3000/uploads/${videoPath}`;
        document.getElementById('video-title').textContent = this.options[this.selectedIndex].text;
        
        // Initialize interactions for the selected video
        videoInteractions.loadVideo(videoPath);
    }
});

class VideoGrid {
    constructor() {
        this.grid = document.getElementById('video-grid');
        this.sortSelect = document.getElementById('sort-videos');
        this.videos = [];
        this.init();
    }

    async init() {
        await this.loadVideos();
        this.setupEventListeners();
    }

    async loadVideos() {
        try {
            const response = await fetch('http://localhost:3000/videos');
            this.videos = await response.json();
            this.renderVideos();
        } catch (error) {
            console.error('Error loading videos:', error);
        }
    }

    renderVideos() {
        this.grid.innerHTML = this.videos.map(video => `
            <div class="video-card" data-id="${video.id}">
                <div class="video-thumbnail">
                    <video src="uploads/${video.path}" preload="metadata"></video>
                    <span class="video-duration"></span>
                </div>
                <div class="video-info">
                    <h3>${video.title}</h3>
                    <div class="video-stats">
                        <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
                        <span><i class="fas fa-thumbs-up"></i> ${video.likes || 0}</span>
                    </div>
                    <div class="channel-info">
                        <img src="uploads/${video.logo}" alt="${video.channelName}">
                        <span>${video.channelName}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.grid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `video.html?id=${card.dataset.id}`;
            });
        });
    }

    setupEventListeners() {
        this.sortSelect.addEventListener('change', () => {
            this.sortVideos(this.sortSelect.value);
        });
    }

    sortVideos(criteria) {
        switch(criteria) {
            case 'popular':
                this.videos.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
            case 'liked':
                this.videos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            case 'newest':
                this.videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
        }
        this.renderVideos();
    }
}

class VideoInteractions {
    constructor() {
        this.checkAuth();
        this.setupEventListeners();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            document.querySelectorAll('.auth-required').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = '/login.html';
                });
            });
        }
    }

    async likeVideo(videoId) {
        try {
            const response = await fetch(`/api/videos/${videoId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                this.updateLikeUI(videoId, data.likes);
            }
        } catch (error) {
            console.error('Like error:', error);
        }
    }

    async addComment(videoId, content) {
        try {
            const response = await fetch(`/api/videos/${videoId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content })
            });
            const data = await response.json();
            if (data.success) {
                this.updateCommentsUI(videoId);
            }
        } catch (error) {
            console.error('Comment error:', error);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    videoInteractions = new VideoInteractions();
    new VideoGrid();
});