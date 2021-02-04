export class OmegaLoadingScreen {
    displayLoadingUI() {
        const loadingScreenDiv = window.document.getElementById('omegaLoadingScreen');
        loadingScreenDiv.style.display = 'block';

        const statusDiv = loadingScreenDiv.getElementsByClassName('status')[0];
        statusDiv.classList.add('loadingAssets');
    }

    hideLoadingUI() {
        const loadingScreenDiv = window.document.getElementById('omegaLoadingScreen');
        loadingScreenDiv.style.display = 'none';

        const statusDiv = loadingScreenDiv.getElementsByClassName('status')[0];
        statusDiv.classList.remove('loadingAssets');
    }
}
