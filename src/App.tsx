import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { apps, flash, send } from 'ionicons/icons';
import OmegaApp from './OmegaApp';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager: TitleBarPlugin.TitleBarManager;

const App: React.FC = () => {
  document.addEventListener('deviceready', () => {
    titleBarManager.setVisibility(
      1, // HIDDEN
      1); // HIDDEN
    appManager.setVisible('show');
    window.screen.orientation.lock('landscape');
  }, false);

  return <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/" component={OmegaApp} exact={true} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
};

export default App;
