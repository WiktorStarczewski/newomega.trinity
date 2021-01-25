import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonPage,
  IonButton
} from '@ionic/react';
import React, {useState } from 'react';
import './Tab1.css';
declare let appManager: AppManagerPlugin.AppManager;
declare let titleBarManager:TitleBarPlugin.TitleBarManager;

const Tab1:React.FC=()=>{
  let titleBarForegroundMode={
    /** Title bar title and icons use a light (white) color. Use this on a dark background color. */
    LIGHT:0,
    /** Title bar title and icons use a dark (dark gray) color. Use this on a light background color. */
    DARK:1
  };
  let titleBarNavigationMode ={
  /** Home icon - minimizes the currently active app and returns to launcher. */
   HOME:0,
  /** Close icon - closes the currently active app and returns to the launcher. */
   CLOSE:1
   }
    let [color,setColor] = useState('');
    
    let str = localStorage.getItem("bgColor") || "lightBg";
    let [bgColor,setbgColor] = useState(str);  
    let hanldeItem=(item:any)=>{
      switch(item.key){
        case 'test':
          appManager.sendIntent('changeColor',{},{},(msg)=>{
            alert('clicked:'+JSON.stringify(msg));
          },(err)=>{
             alert(JSON.stringify(err));
          });
          break;
        case 'test1':
            setbgColor('lightBg');
            localStorage.setItem("bgColor","lightBg");
            break;  
      }
    }
    let initTitle=()=>{
      titleBarManager.setTitle("tab1");
      titleBarManager.setBackgroundColor("#ff9f46");
      titleBarManager.setForegroundMode(titleBarForegroundMode.LIGHT);
      titleBarManager.setNavigationMode(titleBarNavigationMode.HOME);
      titleBarManager.addOnItemClickedListener((clickitem)=>{      
        hanldeItem(clickitem);
      });
      titleBarManager.setupMenuItems([{'key':"test",'iconPath':'./assets/icon/favicon.png',title:'darkbg'},
                                      {'key':"test1",'iconPath':'./assets/icon/favicon.png',title:'lightbg'}]);
                                      
      appManager.setIntentListener((msg)=>{
        if(msg.action === "changeColor"){
          setbgColor('darkBg');
          localStorage.setItem("bgColor","darkBg");
        }
      });
      appManager.setVisible("show");
    }
    let tankaung = ()=>{
      if(color === ''){
        setColor('red');
      }else{
        setColor('');
      }
     
    };
    document.addEventListener("deviceready", ()=>{
      initTitle();
    }, false);
    return (
      <IonPage>
      <IonContent>
      <div className={bgColor}>
        <IonCard className="welcome-card">
          <img src="/assets/shapes.svg" alt=""/>
          <IonCardHeader>
            <IonCardSubtitle>Get Started</IonCardSubtitle>
            <IonCardTitle>Welcome to Elastos!</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>
              This starter project comes with simple tabs-based layout for apps that are going to primarily use a Tabbed UI.

              Take a look at the src/app/pages/ directory to add or change tabs, update any existing page or create new pages.

              A default header-bar-component has been created to show you how to use custom UI components. That components also makes use of Trinity's AppService plugin as a sample.
            </p>
            
    <IonButton onClick={tankaung} className={color}>test click</IonButton>
          </IonCardContent>
        </IonCard>
        </div>
      </IonContent>
   
    </IonPage>
    );
  };

  export default Tab1;
