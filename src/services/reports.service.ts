import { BaseService } from './base.service';
import { Report, SalesReport, InventoryReport, FinancialReport } from '../types';

export class ReportsService extends BaseService {
  async getSalesReports(startDate?: string, endDate?: string) {
    try {
      console.log('Fetching sales reports...', { startDate, endDate }); // سجل للتتبع
      let query = this.db
        .from('sales')
        .select(`
          id,
          date,
          total,
          customer:customers(id, name),
          items:sale_items(
            id,
            quantity,
            price,
            product:products(id, name)
          )
        `);

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error); // سجل للتتبع
        throw error;
      }
      
      console.log('Sales data fetched:', data); // سجل للتتبع
      return data || [];
    } catch (error) {
      console.error('Error in getSalesReports:', error);
      throw error;
    }
  }

  async getInventoryReports() {
    try {
      console.log('Fetching inventory reports...'); // سجل للتتبع
      const { data, error } = await this.db
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          quantity,
          category,
          supplier:suppliers(id, name),
          low_stock_alert
        `)
        .order('name');

      if (error) {
        console.error('Supabase error:', error); // سجل للتتبع
        throw error;
      }

      console.log('Inventory data fetched:', data); // سجل للتتبع
      return data || [];
    } catch (error) {
      console.error('Error in getInventoryReports:', error);
      throw error;
    }
  }

  async getFinancialReports(startDate?: string, endDate?: string) {
    try {
      let query = this.db
        .from('transactions')
        .select(`
          *,
          account:accounts(name, type)
        `);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل التقارير المالية');
    }
  }

  async getBalanceSheet() {
    try {
      console.log('Fetching balance sheet...'); // سجل للتتبع

      // جلب الأصول
      const { data: assets, error: assetsError } = await this.db
        .from('accounts')
        .select('*')
        .eq('type', 'asset');

      if (assetsError) throw assetsError;

      // جلب الالتزامات
      const { data: liabilities, error: liabilitiesError } = await this.db
        .from('accounts')
        .select('*')
        .eq('type', 'liability');

      if (liabilitiesError) throw liabilitiesError;

      // جلب حقوق الملكية
      const { data: equity, error: equityError } = await this.db
        .from('accounts')
        .select('*')
        .eq('type', 'equity');

      if (equityError) throw equityError;

      // حساب الأرصدة
      const calculateBalance = async (accountId: string) => {
        const { data: transactions, error: transactionsError } = await this.db
          .from('transactions')
          .select('amount, type')
          .eq('account_id', accountId);

        if (transactionsError) throw transactionsError;

        return transactions?.reduce((balance, transaction) => {
          return balance + (transaction.type === 'debit' ? transaction.amount : -transaction.amount);
        }, 0) || 0;
      };

      // إضافة الأرصدة إلى الحسابات
      const addBalances = async (accounts: any[]) => {
        return Promise.all(
          accounts.map(async (account) => ({
            ...account,
            balance: await calculateBalance(account.id)
          }))
        );
      };

      const [assetsWithBalances, liabilitiesWithBalances, equityWithBalances] = await Promise.all([
        addBalances(assets || []),
        addBalances(liabilities || []),
        addBalances(equity || [])
      ]);

      const result = [...assetsWithBalances, ...liabilitiesWithBalances, ...equityWithBalances];
      console.log('Balance sheet data fetched:', result); // سجل للتتبع
      return result;
    } catch (error) {
      console.error('Error in getBalanceSheet:', error);
      throw error;
    }
  }

  async getIncomeStatement(startDate?: string, endDate?: string) {
    try {
      console.log('Fetching income statement...', { startDate, endDate }); // سجل للتتبع
      let query = this.db
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          type,
          account:accounts(id, name, type)
        `);

      if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query
        .in('account.type', ['revenue', 'expense'])
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error); // سجل للتتبع
        throw error;
      }

      console.log('Income statement data fetched:', data); // سجل للتتبع
      return data || [];
    } catch (error) {
      console.error('Error in getIncomeStatement:', error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();
