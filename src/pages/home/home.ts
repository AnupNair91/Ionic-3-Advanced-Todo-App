import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { Keyboard } from '@ionic-native/keyboard';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { PayPal, PayPalPayment, PayPalConfiguration } from '@ionic-native/paypal';
import { FCM } from '@ionic-native/fcm';
import { ActionSheetController } from 'ionic-angular';
import { CacheService } from "ionic-cache";
import { SpeechRecognition } from '@ionic-native/speech-recognition';

/**
 * Generated class for the HomePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  noti:string = 'searching notifications';
  todo:string;
  edit:boolean = false;
  listItems = [];
  emt:boolean = false;
  idx = null;
  rec:boolean = false;
  @ViewChild('myInput') myInput ;


  constructor(platform: Platform,public navCtrl: NavController, public navParams: NavParams, private fcm:FCM,
              public cache: CacheService,
              private keyboard: Keyboard,
              private elRef:ElementRef,
              private payPal: PayPal,
              private speechRecognition: SpeechRecognition,
              public actionCtrl: ActionSheetController) {
    platform.ready().then(() => {
      //this.notification();
      cache.setDefaultTTL(60 * 60 * 24 * 365);
      cache.setOfflineInvalidate(false);
      this.getList();
    });
  }

  getList(){
    this.cache.getItem('list').catch((e) => {
      // fall here if item is expired or doesn't exist
      this.emt = true;
      console.log(e);
      return;
  }).then((data) => {
      console.log(data);
      if(data.length != 0){
      this.listItems = data;
      }
      else{
      this.emt = true;
      }
  });
  }

  togadd(){
    this.edit = !(this.edit);
    this.todo = '';
    this.idx = null;

    if(this.edit){
   this.keyfocus();
  }

  }

  keyfocus(){
    setTimeout(()=>{
      this.myInput.setFocus();
    },10);
  }

  saveList(){
    if(this.idx == null){
    this.listItems.push(this.todo);
    }else{
      this.listItems[this.idx] = this.todo;
    }
    
    this.cache.saveItem('list', this.listItems);
    this.cancel();
    this.emt = false;
  }

  cancel(){
    
    this.todo = '';
    this.idx = null;
    this.rec = false;
    this.edit = false;
  }

  notification(){
  this.fcm.onNotification().subscribe(data=>{
    if(data.wasTapped){
      console.log(data);
      console.log("Received in background");
      this.noti = "Received in background";
    } else {
      console.log(data);
      console.log("Received in foreground");
      this.noti = "Received in foreground";

    };
  })
}

presentAction(item,i) {
  this.idx = i;
  let actionSheet = this.actionCtrl.create({
    title: 'What to do?',
    buttons: [
      {
        text: 'Edit',
        handler: () => {
          this.edit = true;
          this.todo = item;
        }
      },{
        text: 'Delete',
        handler: () => {
          this.listItems.splice(i, 1);
          this.cache.saveItem('list', this.listItems);
          if(this.listItems.length == 0){
            this.emt = true;
          }
        }
      },{
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log(item,'Cancel clicked');
        }
      }
    ]
  });
  actionSheet.present();
}

speechrec(){

          // Check feature available
        this.speechRecognition.isRecognitionAvailable()
        .then((available: boolean) => console.log(available))


        //check and request permission
        this.speechRecognition.hasPermission()
        .then((hasPermission: boolean) => {
          console.log(hasPermission);
          if(!hasPermission){

            this.speechRecognition.requestPermission()
            .then(
              () => {console.log('Granted'); this.startrec();},
              () => {console.log('Denied'); return;}
            )

          }else{
            this.startrec();
          }
        });

}

startrec(){

  this.rec = true;
  this.edit = true;
  // Start the recognition process
  this.speechRecognition.startListening()
  .subscribe(
    (matches: Array<string>) => {console.log(matches);
    this.todo = matches[0];
    this.rec = false;
    },
    (onerror) => {console.log('error:', onerror); this.rec = false; this.edit = false;}
  );


}
}

