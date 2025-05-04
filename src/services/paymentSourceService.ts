
import { PaymentSource } from '@/types/models';
import { storage } from './localStorage';
import { initialPaymentSources, generateId } from './mockData';
import { expenseService } from './expenseService';

const STORAGE_KEY = 'paymentSources';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const paymentSourceService = {
  getAll: async (): Promise<PaymentSource[]> => {
    await delay(300);
    return storage.get<PaymentSource[]>(STORAGE_KEY, initialPaymentSources);
  },

  getById: async (id: string): Promise<PaymentSource | null> => {
    await delay(200);
    const sources = storage.get<PaymentSource[]>(STORAGE_KEY, initialPaymentSources);
    return sources.find(source => source.id === id) || null;
  },

  create: async (source: PaymentSource): Promise<PaymentSource> => {
    await delay(400);
    const sources = storage.get<PaymentSource[]>(STORAGE_KEY, initialPaymentSources);
    
    const newSource: PaymentSource = {
      ...source,
      id: source.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.set(STORAGE_KEY, [...sources, newSource]);
    return newSource;
  },

  update: async (id: string, sourceData: Partial<PaymentSource>): Promise<PaymentSource> => {
    await delay(400);
    const sources = storage.get<PaymentSource[]>(STORAGE_KEY, initialPaymentSources);
    const index = sources.findIndex(source => source.id === id);
    
    if (index === -1) {
      throw new Error(`Payment source with ID ${id} not found`);
    }
    
    const updatedSource: PaymentSource = {
      ...sources[index],
      ...sourceData,
      updatedAt: new Date().toISOString()
    };
    
    sources[index] = updatedSource;
    storage.set(STORAGE_KEY, sources);
    
    return updatedSource;
  },

  delete: async (id: string): Promise<void> => {
    await delay(400);
    const sources = storage.get<PaymentSource[]>(STORAGE_KEY, initialPaymentSources);
    
    // Check if this is the last payment source
    if (sources.length <= 1) {
      throw new Error('Cannot delete the last payment source');
    }
    
    const filteredSources = sources.filter(source => source.id !== id);
    storage.set(STORAGE_KEY, filteredSources);
    
    // Delete or reassign related expenses
    await expenseService.deleteByPaymentSource(id);
  }
};
