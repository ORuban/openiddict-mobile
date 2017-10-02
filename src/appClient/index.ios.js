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

export default class appClient extends Component {
  _loginClickHandler() {
    SafariView.isAvailable()
      .then(SafariView.show({
        url: "https://github.com"
      }))
      .catch(error => {
        // Fallback WebView code for iOS 8 and earlier
      });
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
