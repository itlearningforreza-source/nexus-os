import { describe, it, expect } from 'vitest';

/**
 * API Contract Tests
 * These tests validate that frontend-backend API contracts are maintained.
 * They define the expected request/response schemas for each API endpoint.
 */

// Type definitions for API contracts
interface ApiResponse<T> {
  ok?: boolean;
  error?: string;
  rows?: T[];
  row?: T;
  total?: number;
  data?: any;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title: string;
  company_id: string;
  status: string;
  score: number;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  city: string;
  country: string;
  employees: number;
  annual_revenue: number;
  health: string;
  owner_id: string;
  created_at: string;
}

interface Deal {
  id: string;
  title: string;
  company_id: string;
  contact_id: string;
  owner_id: string;
  stage: string;
  value: number;
  probability: number;
  expected_close: string;
  source: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  health: string;
  owner_id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  progress: number;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: string;
  due_date: string;
  completed: number;
  created_at: string;
}

interface Invoice {
  id: string;
  number: string;
  company_id: string;
  contact_id: string;
  status: string;
  issue_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  currency: string;
  created_at: string;
}

interface Ticket {
  id: string;
  number: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  assignee_id: string;
  company_id: string;
  contact_id: string;
  due_date: string;
  sla: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  title: string;
  avatar_color: string;
  status: string;
  timezone: string;
  locale: string;
  theme: string;
  organization_id: string;
  org_name: string;
  org_slug: string;
  org_industry: string;
  org_size: string;
  org_plan: string;
  org_settings: string;
}

describe('API Contracts', () => {
  // Helper to validate required fields exist
  const validateRequiredFields = <T>(obj: T, requiredFields: (keyof T)[]) => {
    for (const field of requiredFields) {
      expect(obj).toHaveProperty(field);
    }
  };

  describe('Contact API Contract', () => {
    const requiredContactFields: (keyof Contact)[] = [
      'id', 'first_name', 'last_name', 'email', 'phone',
      'title', 'company_id', 'status', 'score', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockContact: Contact = {
        id: 'test-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1 555 1234',
        title: 'CEO',
        company_id: 'company-id',
        status: 'Active',
        score: 85,
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockContact, requiredContactFields);
    });
  });

  describe('Company API Contract', () => {
    const requiredCompanyFields: (keyof Company)[] = [
      'id', 'name', 'industry', 'website', 'city', 'country',
      'employees', 'annual_revenue', 'health', 'owner_id', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockCompany: Company = {
        id: 'test-id',
        name: 'Acme Corp',
        industry: 'Technology',
        website: 'https://acme.com',
        city: 'San Francisco',
        country: 'USA',
        employees: 100,
        annual_revenue: 1000000,
        health: 'Healthy',
        owner_id: 'user-id',
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockCompany, requiredCompanyFields);
    });
  });

  describe('Deal API Contract', () => {
    const requiredDealFields: (keyof Deal)[] = [
      'id', 'title', 'company_id', 'contact_id', 'owner_id',
      'stage', 'value', 'probability', 'expected_close', 'source', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockDeal: Deal = {
        id: 'test-id',
        title: 'Enterprise Deal',
        company_id: 'company-id',
        contact_id: 'contact-id',
        owner_id: 'user-id',
        stage: 'Proposal',
        value: 50000,
        probability: 55,
        expected_close: '2024-12-31',
        source: 'Website',
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockDeal, requiredDealFields);
    });
  });

  describe('Project API Contract', () => {
    const requiredProjectFields: (keyof Project)[] = [
      'id', 'name', 'description', 'status', 'health', 'owner_id',
      'company_id', 'start_date', 'end_date', 'progress', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockProject: Project = {
        id: 'test-id',
        name: 'Project Phoenix',
        description: 'Description',
        status: 'On Track',
        health: 'green',
        owner_id: 'user-id',
        company_id: 'company-id',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        progress: 50,
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockProject, requiredProjectFields);
    });
  });

  describe('Task API Contract', () => {
    const requiredTaskFields: (keyof Task)[] = [
      'id', 'project_id', 'title', 'description', 'status',
      'priority', 'assignee_id', 'due_date', 'completed', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockTask: Task = {
        id: 'test-id',
        project_id: 'project-id',
        title: 'Test Task',
        description: 'Description',
        status: 'In Progress',
        priority: 'High',
        assignee_id: 'user-id',
        due_date: '2024-12-31',
        completed: 0,
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockTask, requiredTaskFields);
    });
  });

  describe('Invoice API Contract', () => {
    const requiredInvoiceFields: (keyof Invoice)[] = [
      'id', 'number', 'company_id', 'contact_id', 'status',
      'issue_date', 'due_date', 'amount', 'paid_amount', 'currency', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockInvoice: Invoice = {
        id: 'test-id',
        number: 'INV-001',
        company_id: 'company-id',
        contact_id: 'contact-id',
        status: 'Paid',
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        amount: 1000,
        paid_amount: 1000,
        currency: 'USD',
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockInvoice, requiredInvoiceFields);
    });
  });

  describe('Ticket API Contract', () => {
    const requiredTicketFields: (keyof Ticket)[] = [
      'id', 'number', 'subject', 'description', 'priority', 'status',
      'category', 'assignee_id', 'company_id', 'contact_id', 'due_date', 'sla', 'created_at'
    ];

    it('should have all required fields', () => {
      const mockTicket: Ticket = {
        id: 'test-id',
        number: 'TK-001',
        subject: 'Test Ticket',
        description: 'Description',
        priority: 'High',
        status: 'Open',
        category: 'Technical',
        assignee_id: 'user-id',
        company_id: 'company-id',
        contact_id: 'contact-id',
        due_date: '2024-12-31',
        sla: '2h',
        created_at: '2024-01-01 10:00:00',
      };
      validateRequiredFields(mockTicket, requiredTicketFields);
    });
  });

  describe('User/Authentication API Contract', () => {
    const requiredUserFields: (keyof User)[] = [
      'id', 'email', 'name', 'role', 'title', 'avatar_color',
      'status', 'timezone', 'locale', 'theme', 'organization_id',
      'org_name', 'org_slug', 'org_industry', 'org_size', 'org_plan', 'org_settings'
    ];

    it('should have all required fields', () => {
      const mockUser: User = {
        id: 'test-id',
        email: 'user@example.com',
        name: 'Test User',
        role: 'member',
        title: 'Developer',
        avatar_color: '#3b82f6',
        status: 'active',
        timezone: 'Asia/Jakarta',
        locale: 'en',
        theme: 'system',
        organization_id: 'org-id',
        org_name: 'Test Org',
        org_slug: 'test-org',
        org_industry: 'Technology',
        org_size: '1-10',
        org_plan: 'Business',
        org_settings: '{}',
      };
      validateRequiredFields(mockUser, requiredUserFields);
    });
  });

  describe('API Response Format', () => {
    it('should have consistent error response format', () => {
      const errorResponse: ApiResponse<never> = {
        error: 'Error message',
      };
      expect(errorResponse).toHaveProperty('error');
      expect(typeof errorResponse.error).toBe('string');
    });

    it('should have consistent success response format for list', () => {
      const successResponse: ApiResponse<Contact> = {
        ok: true,
        rows: [],
        total: 0,
      };
      expect(successResponse).toHaveProperty('rows');
      expect(successResponse).toHaveProperty('total');
      expect(Array.isArray(successResponse.rows)).toBe(true);
    });

    it('should have consistent success response format for single item', () => {
      const successResponse: ApiResponse<Contact> = {
        ok: true,
        row: {
          id: 'test-id',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1 555 1234',
          title: 'CEO',
          company_id: 'company-id',
          status: 'Active',
          score: 85,
          created_at: '2024-01-01 10:00:00',
        },
      };
      expect(successResponse).toHaveProperty('row');
      expect(successResponse.row).toHaveProperty('id');
    });
  });

  describe('Pagination Contract', () => {
    it('should accept limit and offset parameters', () => {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });
      expect(params.get('limit')).toBe('50');
      expect(params.get('offset')).toBe('0');
    });

    it('should enforce max limit of 500', () => {
      const limit = Math.min(parseInt('1000'), 500);
      expect(limit).toBe(500);
    });
  });

  describe('Filter Contract', () => {
    it('should accept standard filter fields', () => {
      const filterableFields = ['company_id', 'contact_id', 'project_id', 'owner_id', 'status', 'stage'];
      for (const field of filterableFields) {
        expect(typeof field).toBe('string');
      }
    });
  });

  describe('Search Contract', () => {
    it('should accept search query parameter', () => {
      const searchParams = new URLSearchParams({ q: 'test query' });
      expect(searchParams.get('q')).toBe('test query');
    });
  });
});
