const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('\n🔐 Resetting Admin Password...\n');

    // New password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Find admin user (you can change the email)
    const adminEmail = 'admin@fastdrop.com'; // Change this to your admin email

    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!user) {
      console.log('❌ User not found with email:', adminEmail);
      console.log('\nAvailable users:');
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      
      console.table(allUsers);
      console.log('\n💡 Update the adminEmail variable in this script with the correct email.\n');
      return;
    }

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password reset successful!\n');
    console.log('User Details:');
    console.log('---');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('New Password:', newPassword);
    console.log('---\n');
    console.log('🎉 You can now login with the new password!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
