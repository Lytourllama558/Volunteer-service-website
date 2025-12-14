import { useState, useEffect } from 'react';
import { fetchOpportunities } from '../services/api';
import { Opportunity } from '../App';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('加载志愿机会失败:', err);
      setError(err instanceof Error ? err.message : '加载志愿机会失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  return {
    opportunities,
    loading,
    error,
    refreshOpportunities: loadOpportunities
  };
}
