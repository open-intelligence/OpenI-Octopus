import React, { PureComponent } from 'react';
import { Menu, Icon, Spin, Dropdown, Avatar, Tooltip, Button } from 'antd';
import Debounce from 'lodash-decorators/debounce';
import { FormattedMessage,formatMessage, setLocale, getLocale } from 'umi/locale';
import styles from './index.less';

export default class GlobalHeader extends PureComponent {
  componentWillUnmount() {
    this.triggerResizeEvent.cancel();
  }

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    onCollapse(!collapsed);
    this.triggerResizeEvent();
  };

  /* eslint-disable*/
  @Debounce(600)
  triggerResizeEvent() {
    const event = document.createEvent('HTMLEvents');
    event.initEvent('resize', true, false);
    window.dispatchEvent(event);
  }
  changLang() {
    const locale = getLocale();
    if (!locale || locale === 'zh-CN') {
      setLocale('en-US');
    } else {
      setLocale('zh-CN');
    }
  }
  render() {
    const {
      currentUser = {},
      onMenuClick,
    } = this.props;
    const menu = (
      <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
        <Menu.Item key="setUserInfo">
            <Icon type="edit" />
            <FormattedMessage id="globalHeader.setUserInfo" />
        </Menu.Item>
        <Menu.Item key="changePwd">
          <Icon type="edit" />
          <FormattedMessage id="globalHeader.changePwd" />
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="logout">
          <Icon type="logout" />
            <FormattedMessage id="globalHeader.logout" />
        </Menu.Item>
      </Menu>
    );
    return (
      <div className={styles.header}>

        <div className={styles.right}>

          <Tooltip title={formatMessage({id:'globalHeader.helpDoc'})}>
            <a
              target="_blank"
              href={__WEBPORTAL__.helpDocUri}
              className={styles.action}
            >
              <Icon type="question-circle-o" />
            </a>
          </Tooltip>

          {currentUser && currentUser.username ? (
            <Dropdown overlay={menu}>
              <span className={`${styles.action} ${styles.account}`}>
                <Avatar size="small" className={styles.avatar} icon="user" />
                <span className={styles.name}>{currentUser.username}</span>
              </span>
            </Dropdown>
          ) : (
            <Spin size="small" className={styles['spin-avatar']} />
          )}
          <Tooltip
              title={formatMessage({id:'globalHeader.changeLang'})}
              placement="bottom">
            <Button className={styles.langBtn}
              size="small"
              onClick={() => {
                this.changLang();
              }}
            >
              <FormattedMessage id="globalHeader.lang" />
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  }
}
