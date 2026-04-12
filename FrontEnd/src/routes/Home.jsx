import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Segmented, Space, Statistic, Typography } from 'antd';
import { Pie } from '@ant-design/charts';
import dayjs from 'dayjs';

import MessageContext from '../helpers/core/MessageContext';

import ContentPanel from '../components/core/layout/ContentPanel';
import CashFlowApi from '../helpers/api/cashflow';

const monthsIntervals = [1, 2, 3, 6, 12];

const Home = () => {
  const { t } = useTranslation();
  const { errorMsg: msgErr } = useContext(MessageContext);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(monthsIntervals[0]);
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const startDate = dayjs().subtract(months, 'month').startOf('month').toISOString();
        const response = await CashFlowApi.listSummary({ dateMin: startDate });
        setData(response.data);
      } catch (error) {
        msgErr('cashflow-summary', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [msgErr, months]);

  const summary = useMemo(() => {
    const income = data.reduce((acc, e) => acc + (e.data.income || 0), 0);
    const expense = data.reduce((acc, e) => acc + (e.data.expense || 0), 0);

    return {
      income,
      expense,
      net: income - expense,
      count: data.length
    };
  }, [data]);

  const pieData = useMemo(
    () => [
      { type: 'income', value: summary.income },
      { type: 'expense', value: summary.expense }
    ],
    [summary]
  );

  return (
    <ContentPanel
      title={t('common.home')}
      loading={loading}
      titleAction={
        <Space direction="vertical" size={2}>
          <Typography.Text type="secondary">{t('cashflow.period')}</Typography.Text>
          <Segmented options={monthsIntervals} value={months} onChange={setMonths} />
        </Space>
      }
    >
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={8} md={8}>
          {!data.length ? (
            <Card>
              <Empty description={t('common.emptyField')} />
            </Card>
          ) : (
            <Card title={t('cashflow.type.income') + ' / ' + t('cashflow.type.expense')}>
              <Pie
                data={pieData}
                angleField="value"
                colorField="type"
                radius={0.9}
                innerRadius={0.55}
                scale={{ color: { domain: ['income', 'expense'], range: ['#52c41a', '#f5222d'] } }}
                legend={{ color: { labelFormatter: value => t(`cashflow.type.${value}`) } }}
              />
            </Card>
          )}
        </Col>
        <Col xs={8} md={8}>
          <Card>
            <Statistic title={t('cashflow.type.income')} precision={2} value={summary.income} />
            <Statistic title={t('cashflow.type.expense')} precision={2} value={summary.expense} />
            <Statistic
              title={t('cashflow.type.net')}
              precision={2}
              value={summary.net}
              valueStyle={{ color: summary.net >= 0 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    </ContentPanel>
  );
};

export default Home;
