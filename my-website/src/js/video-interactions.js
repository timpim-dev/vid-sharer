class VideoInteractions {
    constructor() {
        this.currentVideo = {
            id: null,
            likes: 0,
            dislikes: 0,
            views: 0,
            comments: []
        };

        this.elements = {
            likeBtn: document.getElementById('like-btn'),
            dislikeBtn: document.getElementById('dislike-btn'),
            likesCount: document.getElementById('likes-count'),
            dislikesCount: document.getElementById('dislikes-count'),
            viewsCount: document.querySelector('.video-stats span'),
            commentForm: document.getElementById('comment-form'),
            commentsList: document.getElementById('comments-list'),
            commentText: document.getElementById('comment-text')
        };

        this.init();
    }

    init() {
        // Add event listeners
        this.elements.likeBtn.addEventListener('click', () => this.handleLike());
        this.elements.dislikeBtn.addEventListener('click', () => this.handleDislike());
        this.elements.commentForm.addEventListener('submit', (e) => this.handleComment(e));
        document.getElementById('video-player').addEventListener('play', () => this.handleView());
    }

    handleLike() {
        if (this.currentVideo.hasDisliked) {
            this.currentVideo.dislikes--;
            this.currentVideo.hasDisliked = false;
            this.elements.dislikeBtn.classList.remove('active');
        }

        if (!this.currentVideo.hasLiked) {
            this.currentVideo.likes++;
            this.currentVideo.hasLiked = true;
            this.elements.likeBtn.classList.add('active');
        } else {
            this.currentVideo.likes--;
            this.currentVideo.hasLiked = false;
            this.elements.likeBtn.classList.remove('active');
        }

        this.updateUI();
        this.saveToStorage();
    }

    handleDislike() {
        if (this.currentVideo.hasLiked) {
            this.currentVideo.likes--;
            this.currentVideo.hasLiked = false;
            this.elements.likeBtn.classList.remove('active');
        }

        if (!this.currentVideo.hasDisliked) {
            this.currentVideo.dislikes++;
            this.currentVideo.hasDisliked = true;
            this.elements.dislikeBtn.classList.add('active');
        } else {
            this.currentVideo.dislikes--;
            this.currentVideo.hasDisliked = false;
            this.elements.dislikeBtn.classList.remove('active');
        }

        this.updateUI();
        this.saveToStorage();
    }

    handleView() {
        if (!this.currentVideo.viewed) {
            this.currentVideo.views++;
            this.currentVideo.viewed = true;
            this.updateUI();
            this.saveToStorage();
        }
    }

    handleComment(e) {
        e.preventDefault();
        const commentText = this.elements.commentText.value.trim();
        
        if (commentText) {
            this.currentVideo.comments.unshift({
                text: commentText,
                date: new Date().toISOString(),
                id: Date.now()
            });
            
            this.elements.commentText.value = '';
            this.updateUI();
            this.saveToStorage();
        }
    }

    updateUI() {
        // Update counts
        this.elements.likesCount.textContent = this.currentVideo.likes;
        this.elements.dislikesCount.textContent = this.currentVideo.dislikes;
        this.elements.viewsCount.innerHTML = `<i class="fas fa-eye"></i> ${this.currentVideo.views} views`;

        // Update comments
        this.elements.commentsList.innerHTML = this.currentVideo.comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span>Anonymous • ${this.formatDate(comment.date)}</span>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
    }

    loadVideo(videoId) {
        this.currentVideo.id = videoId;
        const savedData = localStorage.getItem(`video_${videoId}`);
        
        if (savedData) {
            Object.assign(this.currentVideo, JSON.parse(savedData));
        } else {
            Object.assign(this.currentVideo, {
                likes: 0,
                dislikes: 0,
                views: 0,
                comments: [],
                hasLiked: false,
                hasDisliked: false,
                viewed: false
            });
        }

        this.updateUI();
    }

    saveToStorage() {
        if (this.currentVideo.id) {
            localStorage.setItem(
                `video_${this.currentVideo.id}`, 
                JSON.stringify(this.currentVideo)
            );
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.videoInteractions = new VideoInteractions();
});