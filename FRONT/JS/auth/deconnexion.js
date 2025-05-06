// Gestion de la déconnexion
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'logoutBtn') {
        localStorage.removeItem('currentUser');
        window.location.href = '../../HTML/connexion/connexion.html';
    }
});

// Vérification de l'authentification au chargement
document.addEventListener("DOMContentLoaded", function() {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) {
        window.location.href = "../../HTML/connexion/connexion.html";
    }
});