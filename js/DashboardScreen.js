'use strict';

import React, { Component } from 'react';
import {
  AppRegistry,
  Alert,
  Text,
  View,
  StyleSheet,
  PixelRatio,
  TouchableOpacity,
  TouchableHighlight,
  Button,
  ImageBackground
} from 'react-native';

import {
  ViroARSceneNavigator
} from 'react-viro';

import { AppConsumer } from './Context';
const gridBackground = require('./res/grid_background.png')
import { Actions } from 'react-native-router-flux';

import DroppedObjList from './DroppedObjList';


var sharedProps = {
  apiKey:"912A3CB8-1A43-42D2-BFDF-2659B6DA962E",
}

var ARSceneScreen = require('./ARSceneScreen');

export default class DashboardScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      arOn: false,
      navError: false
    };

  }

  render() {
    if(!this.state.arOn){
      return this.dashboardMode();
    } else if (this.state.arOn === true){
      return this.getARNavigator()
    }
  }

  dashboardMode(){
    return (
      <AppConsumer>
        {({ setObjToSearch, droppedObjs, organizedDroppedObjs, organizeDroppedObj, objToSearch, userLat, userLong, calculatedObjPos, listSelect }) => (
          <ImageBackground style={styles.gridBackground} source={gridBackground}>
            <View style={styles.titleBox}>
              <Text style={{ fontSize: 40, fontWeight: 'bold', fontFamily: 'Helvetica' }}>
                DASH
              </Text>
              <Text style={{ fontSize: 40, fontWeight: 'bold', fontFamily: 'Helvetica', color: 'gray' }}>
                BOARD
              </Text>
            </View>
            <View style={{ flex: 0, height: '60%', width:'80%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', backgroundColor: 'blue'}}>
                <View style={styles.tableHeader}>
                  <Text style={{ fontWeight: 'bold', color: 'white'}}>
                    Latitude
                  </Text>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={{ fontWeight: 'bold', color: 'white'}}>
                    Longitude
                  </Text>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={{ fontWeight: 'bold', color: 'white'}}>
                    Dist (m)
                  </Text>
                </View>
                <View style={styles.tableHeader}>
                  <Text style={{ fontWeight: 'bold', color: 'white'}}>
                    AR MODE
                  </Text>
                </View>
              </View>
              { this.makeTable(organizedDroppedObjs, listSelect) }
            </View>
            <Button title="GO" onPress={() => this.enterAR(objToSearch, userLat, userLong, calculatedObjPos)}/>
          </ImageBackground>
        )}
      </AppConsumer>
    );
  }


  makeTable = (organizedDroppedObjs, listSelect) => {
    return organizedDroppedObjs.map((obj, i) => {
      return (
        <DroppedObjList
          key={i}
          objectId={obj.id}
          latitude={obj.latitude}
          longitude={obj.longitude}
          distance={obj.distance}
          listSelect={listSelect}
          enterAR={this.enterAR}
        />
      )
    })
  }


  getARNavigator() {
    return (
      <AppConsumer>
        {({ setObjToSearch, objToSearch, calculatedObjPos }) => (
          <View style={styles.flex}>
            <ViroARSceneNavigator
              apiKey="912A3CB8-1A43-42D2-BFDF-2659B6DA962E"
              initialScene={{scene: ARSceneScreen}}
              worldAlignment={"GravityAndHeading"}
              viroAppProps={{
                objToSearch: objToSearch,
              }}
            />
            <View style={{flex: 0, flexDirection: 'row',}}>
              <TouchableOpacity style={styles.exitButtonFlex} onPress={() => this._exitAr()}>
                <View style={styles.exitButton}>
                  <Text style={{color: 'white'}}>EXIT AR MODE</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </AppConsumer>
    );
  }

  enterAR(objToSearch, userLat, userLong, calculatedObjPos){
    console.log('ENTERING AR')

    var objLat = objToSearch.latitude
    var objLong = objToSearch.longitude

    this._mapVirtual(userLat, userLong, objLat, objLong)
      .then((objPos)=>{
        return calculatedObjPos(objPos)
      }).then(()=>{
        return this.setState({
          arOn: true,
        })
      })

  }

  _exitAr(){
    this.setState({
      arOn: false,
    })
  }

  latLongToDistanceAway = (lat1, long1, lat2, long2) =>{
    var radiusEarth = 6371e3;

    //convert degrees to radians
    var lat1r = (lat1 * Math.PI)/180
    var lat2r = (lat2 * Math.PI)/180

    //difference lat and difference long in radians
    var dlat = (lat2 - lat1) * Math.PI / 180
    var dlong = (long2 - long1) * Math.PI / 180

    var a = Math.sin(dlat/2) * Math.sin(dlat/2) + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dlong/2) * Math.sin(dlong/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = radiusEarth * c
    return d

  }

  bearingPhoneToObj = (lat1, long1, lat2, long2) =>{
    //convert degrees to radians
    var lat1r = (lat1 * Math.PI)/180
    var lat2r = (lat2 * Math.PI)/180
    var long1r = (long1 * Math.PI)/180
    var long2r = (long2 * Math.PI)/180

    //difference in long in radians
    var dlong = ((long2 - long1) * Math.PI) / 180

    var y = Math.sin(dlong) * Math.cos(lat2r);
    var x = (Math.cos(lat1r) * Math.sin(lat2r)) - (Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(dlong));
    var brng = (Math.atan2(y, x) * 180) / Math.PI
    //returned in degrees between -180 and +180
    console.log('bearing', brng)
    return brng
  }

  _mapVirtual = async (userLat, userLong, objLat, objLong) => {

    let distBetweenPhoneObj = await this.latLongToDistanceAway(userLat, userLong, objLat, objLong)
    let headingPhoneToObj = await this.bearingPhoneToObj(userLat, userLong, objLat, objLong)

    let radiansPhoneToObj = (headingPhoneToObj * Math.PI) / 180

    let objZ = -1 * (Math.cos(radiansPhoneToObj) * distBetweenPhoneObj)
    let objX = Math.sin(radiansPhoneToObj) * distBetweenPhoneObj
    console.log('objZ', objZ, 'objX', objX)

    return {posX: objX, posZ: objZ, disPhoneObj: distBetweenPhoneObj}

    // let display = ` ${userLat} ${userLong} distBetweenPhoneObj: ${distBetweenPhoneObj}, headingPhoneToObj:
    // ${headingPhoneToObj}, objX: ${objX}, objZ: ${objZ}`
  }

}

var styles = StyleSheet.create({
  gridBackground :{
    height: '100%',
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  flex : {
    flex: 1,
  },
  titleBox : {
    flex: 0,
    flexDirection: 'row',
    height: 90,
    alignItems: 'center'
  },
  exitButtonFlex : {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  exitButton : {
    height: 40,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  tableHeader : {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center'
  },

});
