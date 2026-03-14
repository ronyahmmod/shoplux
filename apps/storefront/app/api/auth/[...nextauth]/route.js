import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { connectDB } from '@repo/lib/utils/db';
import { User } from '@repo/lib/models/User';
import { loginSchema } from '@repo/lib/validators';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error('Invalid credentials format');

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email }).select('+password');
        if (!user || !user.password) throw new Error('No account found');
        if (!user.isActive) throw new Error('Account is disabled');

        const isValid = await user.comparePassword(parsed.data.password);
        if (!isValid) throw new Error('Incorrect password');

        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Auto-create account for OAuth users
      if (account?.provider === 'google') {
        await connectDB();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: 'google',
            role: 'customer',
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // Refresh role from DB on each token renewal
      if (!user && token.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser._id.toString();
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
