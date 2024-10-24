import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminDatabases, config } from '@/lib/appwrite';
import bcrypt from 'bcryptjs';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          const admins = await adminDatabases.listDocuments(
            config.admin.databaseId,
            config.admin.collectionId,
            [Query.equal('email', credentials.email)]
          );

          const admin = admins.documents[0];
          if (admin && await bcrypt.compare(credentials.password, admin.password)) {
            return { id: admin.$id, name: admin.name, email: admin.email, role: admin.role };
          }
          return null;
        } catch (error) {
          console.error('Error authorizing admin:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on error
  }
});