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
          colorPrimary: '#1890ff',
          borderRadius: 4,
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
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            {!collapsed && (
              <Title level={4} style={{ margin: '0 0 0 8px', color: '#1890ff' }}>
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

        <Layout>
          {/* 头部 */}
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              {location.pathname === '/' ? '数据看板' : '指标管理'}
            </Title>
            <span style={{ color: '#8c8c8c' }}>产品运营平台 v1.0</span>
          </Header>

          {/* 内容区 */}
          <Content
            style={{
              margin: '24px',
              padding: '24px',
              background: '#fff',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 112px)',
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
