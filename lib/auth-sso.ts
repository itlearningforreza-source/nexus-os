import NextAuth from 'next-auth';
import SAMLProvider from 'next-auth/providers/saml';

const SAML_PROVIDERS = {
  okta: {
    id: 'okta',
    name: 'Okta',
    issuer: process.env.OKTA_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
  azure: {
    id: 'azure',
    name: 'Microsoft Azure AD',
    issuer: process.env.AZURE_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
  google: {
    id: 'google',
    name: 'Google Workspace',
    issuer: process.env.GOOGLE_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
  generic: {
    id: 'saml',
    name: 'SAML SSO',
    issuer: process.env.SAML_ISSUER,
    callbackUrl: process.env.SAML_CALLBACK_URL,
    certificate: process.env.SAML_CERT,
  },
} as const;

type SAMLProviderId = keyof typeof SAML_PROVIDERS;

interface SAMLConfig {
  id: string;
  name: string;
  issuer: string | undefined;
  callbackUrl: string | undefined;
  certificate: string | undefined;
}

function createSAMLProvider(config: SAMLConfig) {
  return {
    id: config.id,
    name: config.name,
    type: 'saml' as const,
    issuer: config.issuer,
    callbackUrl: config.callbackUrl,
    certificate: config.certificate,
    audience: 'nexus-os',
    // Attribute mapping for SAML
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      groups: 'groups',
    },
  };
}

const samlProviders = Object.entries(SAML_PROVIDERS)
  .filter(([, config]) => config.issuer && config.certificate)
  .map(([, config]) => createSAMLProvider(config));

// Only include providers that are configured
const providers = samlProviders.length > 0 ? samlProviders : [];

export const authConfig = {
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'saml') return true;
      
      // Map SAML attributes to user
      // Create/update user in DB
      // This would typically:
      // 1. Find user by email (from SAML)
      // 2. Update user attributes from SAML
      // 3. Handle group/role mapping
      // 4. Create user if not exists (JIT provisioning)
      
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.saml = {
          provider: account.provider,
          nameID: account.providerAccountId,
        };
      }
      if (profile) {
        token.samlAttributes = profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.saml) {
        (session as any).saml = token.saml;
      }
      if (token.samlAttributes) {
        (session as any).samlAttributes = token.samlAttributes;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // User created via SAML JIT provisioning
      console.log('New SAML user created:', user.email);
    },
    async linkAccount({ user, account }) {
      // Account linked
      console.log('SAML account linked for:', user.email);
    },
  },
};

export { SAML_PROVIDERS };
export type { SAMLProviderId };
