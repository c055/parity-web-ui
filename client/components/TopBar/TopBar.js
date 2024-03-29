import React from 'react';

import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
// Needed for onTouchTap, for material ui
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();
const muiTheme = getMuiTheme({});

import {TransactionConfirmation} from '../TransactionConfirmation/TransactionConfirmation';
import {AccountChooser} from '../AccountsChooser/AccountsChooser';

import styles from './styles.css';

export default class extends React.Component {

  state = {
    waiting: 0,
    accounts: [],
    allAccounts: [],
    sendingTransaction: false
  };

  listeners = [];

  constructor (...args) {
    super(...args);
  }

  componentWillMount () {
    this.listeners = [
      this.props.interceptor.intercept('eth_accounts', ::this.onEthAccounts),
      this.props.interceptor.intercept('eth_sendTransaction', ::this.onEthSendTransaction)
    ];
  }

  componentWillUnmount () {
    this.listeners.map((off) => off());
  }

  onEthAccounts (payload, cb, next) {
    const response = {
      jsonrpc: payload.jsonrpc,
      id: payload.id,
      result: this.state.accounts
    };

    if (cb) {
      return cb(null, response);
    }

    return response;
  }

  onEthSendTransaction (payload, cb, next) {
    if (!cb) {
      throw new Error('Synchronous sendTransaction is not supported.');
    }

    this.setState({
      sendingTransaction: true,
      transaction: payload,
      callbackFunc: cb,
      sendTxFunc: next
    });
  }

  clearTx () {
    this.setState({
      sendingTransaction: false,
      transaction: null,
      callbackFunc: null,
      sendTxFunc: null
    });
  }

  abortTransaction () {
    this.state.callbackFunc('aborted');
    this.clearTx();
  }

  confirmTransaction () {
    this.state.sendTxFunc(() => {
      this.clearTx();
    });
  }

  changeAccount (account) {
    this.setState({
      accounts: [account]
    });
    // set default account
    this.props.web3.defaultAccount = account;
  }

  onAllAccounts (accounts) {
    this.setState({
      allAccounts: accounts
    });
  }

  render () {
    // Because dom might not be ready yet
    // we are deferring component load.
    // (We want to load component anyway for
    //  Interceptor logic to kick in)
    if (!document.body) {
      setTimeout(() => {
        this.setState({
          waiting: this.state.waiting + 1
        });
      }, 10);
      return (
        <div className={styles.topbar}>
            <h4 className={styles.header}>Loading...</h4>
        </div>
      );
    }

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <div>
          <div className={styles.topbar}>
            <h4 className={styles.header}>Identity @ Parity</h4>
            <AccountChooser
              onChange={::this.changeAccount}
              onAllAccounts={::this.onAllAccounts}
              />
          </div>
          <TransactionConfirmation
            open={this.state.sendingTransaction}
            transaction={this.state.transaction}
            onAbort={::this.abortTransaction}
            onConfirm={::this.confirmTransaction}
            />
        </div>
      </MuiThemeProvider>
    );
  }

  static propTypes = {
    interceptor: React.PropTypes.object.isRequired,
    web3: React.PropTypes.object.isRequired
  };
}
