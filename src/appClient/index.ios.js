/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button
} from 'react-native';

import SafariView from 'react-native-safari-view';
import { AuthClient } from './app/AuthClient';

export default class appClient extends Component {

  constructor(props) {
    super(props);

    this.authClient = new AuthClient();
    this._loginClickHandler = this._loginClickHandler.bind(this);
  }
  
  _loginClickHandler() {

    this.authClient.login();
  }

  render() {
    return (
      <View style={styles.container}>      
        <Button onPress={this._loginClickHandler} title="Login" />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

AppRegistry.registerComponent('appClient', () => appClient);
