document.addEventListener("DOMContentLoaded", () => {
    const footerElement = document.getElementById("footer");

    if (footerElement) {
        fetch('../composant/footer/footer.html')
            .then(response => response.text())
            .then(data => {
                footerElement.innerHTML = data;
            })
            .catch(error => {
                console.error("Erreur lors du chargement de la barre latérale:", error);
            });
    }
});