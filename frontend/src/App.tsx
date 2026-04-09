/**
 * 主应用组件
 */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  TableOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import MetricManagement from './pages/MetricManagement';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  // 菜单项
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">数据看板</Link>,
    },
    {
      key: '/management',
      icon: <TableOutlined />,
      label: <Link to="/management">指标管理</Link>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0078D4',
          colorSuccess: '#107C10',
          colorWarning: '#FFB900',
          colorError: '#D13438',
          colorInfo: '#0078D4',
          borderRadius: 6,
          fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
          colorBgContainer: '#FFFFFF',
          colorBgLayout: '#F5F5F5',
          colorText: '#323130',
          colorTextSecondary: '#605E5C',
          colorBorder: '#E1DFDD',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {/* 侧边栏 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          style={{
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
            background: '#FFFFFF',
            borderRight: '1px solid #E1DFDD',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #E1DFDD',
              background: '#0078D4',
            }}
          >
            <BarChartOutlined style={{ fontSize: 24, color: '#FFFFFF' }} />
            {!collapsed && (
              <Title level={4} style={{ margin: '0 0 0 12px', color: '#FFFFFF', fontWeight: 500 }}>
                产品运营平台
              </Title>
            )}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>

        <Layout style={{ background: '#F5F5F5' }}>
          {/* 头部 */}
          <Header
            style={{
              background: '#0078D4',
              padding: '0 32px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 56,
              lineHeight: '56px',
            }}
          >
            <Title level={4} style={{ margin: 0, color: '#FFFFFF', fontWeight: 500 }}>
              {location.pathname === '/' ? '数据看板' : '指标管理'}
            </Title>
            <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14 }}>产品运营平台 v1.0</span>
          </Header>

          {/* 内容区 */}
          <Content
            style={{
              margin: '24px',
              padding: '24px',
              background: '#FFFFFF',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 104px)',
              boxShadow: '0 1.6px 3.6px rgba(0, 0, 0, 0.06), 0 3.2px 7.2px rgba(0, 0, 0, 0.08)',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/management" element={<MetricManagement />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

// 包装Router的根组件
const AppWithRouter: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;
