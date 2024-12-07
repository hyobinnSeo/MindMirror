document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('twitter-handle');
    const submitBtn = document.getElementById('submit-btn');

    input.addEventListener('input', (e) => {
        // Remove @ symbol if user types it
        if (e.target.value.startsWith('@')) {
            e.target.value = e.target.value.substring(1);
        }
        
        // Remove spaces
        e.target.value = e.target.value.replace(/\s/g, '');
    });

    submitBtn.addEventListener('click', () => {
        const handle = input.value.trim();
        
        if (!handle) {
            alert('Please enter a Twitter handle');
            return;
        }

        // Basic validation for Twitter handle format
        if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
            alert('Please enter a valid Twitter handle (letters, numbers, and underscores only, max 15 characters)');
            return;
        }

        // Here you can add functionality to process the Twitter handle
        console.log(`Submitted Twitter handle: @${handle}`);
    });
});
