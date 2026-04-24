/**
 * 指标管理页面
 */
import React, { useState, useEffect } from 'react';
import { Button, Space } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import MetricTable from '../components/MetricTable';
import DataEntryModal from '../components/DataEntryModal';
import { hasWritePermission } from '../services/ipAuth';

const MetricManagement: React.FC = () => {
  const [dataEntryVisible, setDataEntryVisible] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    // 检查IP写权限
    hasWritePermission().then(result => {
      setCanWrite(result);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        {canWrite && (
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={() => setDataEntryVisible(true)}
          >
            录入数据
          </Button>
        )}
      </div>
      <MetricTable />
      <DataEntryModal
        visible={dataEntryVisible}
        onCancel={() => setDataEntryVisible(false)}
      />
    </div>
  );
};

export default MetricManagement;
