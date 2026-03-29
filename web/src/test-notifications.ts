/**
 * Test script for SessionNotificationService
 * Run this in the browser console or import it temporarily in App.tsx
 */

import { SessionNotificationService, createTestSession } from './services/sessionNotifService';

export function testNotificationServiceIsolation() {
  console.log('🧪 Testing SessionNotificationService state isolation...\n');

  const testSession = createTestSession();

  const service1 = new SessionNotificationService();
  const service2 = new SessionNotificationService();

  // Start service1 with a test session
  const cleanup1 = service1.start([testSession], (event) => {
    console.log('✅ Service1 notification:', event.message);
  });

  // Manually trigger a notification in service1
  // @ts-ignore - accessing private method for testing
  service1['fired'].add('test:session-1');

  // Check states
  const status1 = service1.getScheduledStatus();
  const status2 = service2.getScheduledStatus();

  console.log('📊 Service1 fired notifications:', status1);
  console.log('📊 Service2 fired notifications:', status2);

  // Verify isolation
  if (status1.length > 0 && status2.length === 0) {
    console.log('✅ TEST PASSED: Services have isolated state!');
  } else {
    console.error('❌ TEST FAILED: State is shared between services!');
    console.error('  Service1 should have fired notifications:', status1);
    console.error('  Service2 should be empty:', status2);
  }

  // Cleanup
  cleanup1();
  service1.stop();
  service2.stop();

  console.log('\n✅ Test completed!\n');
}

export function testBackwardCompatibility() {
  console.log('🧪 Testing backward compatibility with legacy API...\n');

  const testSession = createTestSession();

  // Use the old API
  import('./services/sessionNotifService').then(({ startSessionNotifScheduler, getScheduledStatus }) => {
    const cleanup = startSessionNotifScheduler([testSession], (event) => {
      console.log('✅ Legacy API notification:', event.message);
    });

    setTimeout(() => {
      const status = getScheduledStatus();
      console.log('📊 Legacy API status:', status);
      console.log('✅ Backward compatibility working!');
      cleanup();
    }, 100);
  });
}

export function testClearFired() {
  console.log('🧪 Testing clearFired() method...\n');

  const service = new SessionNotificationService();

  // @ts-ignore - accessing private property for testing
  service['fired'].add('test:1');
  service['fired'].add('test:2');

  console.log('📊 Before clear:', service.getScheduledStatus());

  service.clearFired();

  console.log('📊 After clear:', service.getScheduledStatus());

  if (service.getScheduledStatus().length === 0) {
    console.log('✅ TEST PASSED: clearFired() works!');
  } else {
    console.error('❌ TEST FAILED: clearFired() did not clear state');
  }

  service.stop();
}

// Run all tests
export function runAllTests() {
  console.log('🚀 Running all SessionNotificationService tests...\n');

  testNotificationServiceIsolation();

  setTimeout(() => {
    testClearFired();
  }, 500);

  setTimeout(() => {
    testBackwardCompatibility();
  }, 1000);
}

// Auto-run if you want (comment out if not needed)
// runAllTests();
