export class OmegaLoadingScreen {
    displayLoadingUI() {
        const loadingScreenDiv = window.document.getElementById('omegaLoadingScreen');
        loadingScreenDiv.style.display = 'block';
    }

    hideLoadingUI() {
        const loadingScreenDiv = window.document.getElementById('omegaLoadingScreen');
        loadingScreenDiv.style.display = 'none';
    }
}
