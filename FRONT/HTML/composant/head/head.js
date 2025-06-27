document.addEventListener("DOMContentLoaded", () => {
    const headContent = document.querySelector('head');
    
    fetch('../composant/head/head.html')
        .then(response => response.text())
        .then(html => {
            headContent.insertAdjacentHTML('afterbegin', html);
            
            // Met à jour le titre si spécifié dans le body
            const body = document.body;
            const pageTitle = body.getAttribute('data-title');
            if (pageTitle) {
                const titleElement = document.querySelector('title[data-title]');
                if (titleElement) {
                    titleElement.textContent = pageTitle;
                }
            }
        })
        .catch(error => {
            console.error('Erreur chargement head:', error);
        });
});