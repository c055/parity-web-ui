import React from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

import {isEqual} from 'lodash';

import {Web3Component} from '../Web3Component/Web3Component';
import {Account} from '../Account/Account';

function getLastAccount () {
  return window.localStorage.getItem('parity-lastAccount');
}

function saveLastAccount (acc) {
  window.localStorage.setItem('parity-lastAccount', acc);
}

export class AccountChooser extends Web3Component {

  state = {
    defaultAccountIdx: 0,
    accounts: []
  };

  onTick (next) {
    this.context.web3.eth.getAccounts((err, accounts) => {
      if (err) {
        return;
      }

      if (isEqual(accounts, this.state.accounts)) {
        return;
      }

      const idx = accounts.indexOf(getLastAccount());
      const defaultAccountIdx = idx !== -1 ? idx : this.state.defaultAccountIdx;

      this.setState({
        accounts,
        defaultAccountIdx
      });

      this.props.onAllAccounts(accounts);
      this.props.onChange(accounts[defaultAccountIdx]);
    });
  }

  handleChange (e, index, value) {
    this.setState({
      defaultAccountIdx: value
    });
    const account = this.state.accounts[value];
    saveLastAccount(account);

    this.props.onChange(account);
  }

  render () {
    return (
      <div>
        <DropDownMenu value={this.state.defaultAccountIdx} onChange={::this.handleChange}>
          {this.state.accounts.map((acc, idx) => (
            <MenuItem
              key={acc}
              value={idx}
              primaryText={<Account address={acc} />} />
          ))}
        </DropDownMenu>
      </div>
    );
  }

  static propTypes = {
    onChange: React.PropTypes.func.isRequired,
    onAllAccounts: React.PropTypes.func.isRequired
  };

}
