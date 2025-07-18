// Debug tool for spending reminder notifications
// Open browser console and run: debugSpendingNotifications()

window.debugSpendingNotifications = async () => {
  console.clear();
  console.log("🔍 Debug Spending Reminder Notifications");
  console.log("==========================================");

  // Check settings
  const settings = JSON.parse(
    localStorage.getItem("spendingReminderSettings") || "{}"
  );
  console.log("📋 Settings:", settings);

  // Check if enabled
  const enabled = localStorage.getItem("spendingReminderEnabled");
  console.log("✅ Enabled:", enabled);

  // Check test mode
  const testMode = localStorage.getItem("notificationTestMode");
  console.log("🧪 Test Mode:", testMode);

  if (testMode === "true") {
    console.log("⚠️ Test mode is ON - showing demo notifications");
    const testNotifications = JSON.parse(
      localStorage.getItem("testNotifications") || "[]"
    );
    console.log("🎭 Test notifications:", testNotifications);
    return;
  }

  console.log("💰 Calculating real spending...");

  try {
    // Import services
    const { getDailySpending, getMonthlySpending } = await import(
      "/src/api/spendingReminderService.js"
    );

    const dailySpending = await getDailySpending();
    const monthlySpending = await getMonthlySpending();

    console.log("📅 Daily spending:", dailySpending);
    console.log("📅 Monthly spending:", monthlySpending);

    // Calculate percentages
    const dailyPercentage = settings.dailyLimit
      ? (dailySpending.total / settings.dailyLimit) * 100
      : 0;
    const monthlyPercentage = settings.monthlyLimit
      ? (monthlySpending.total / settings.monthlyLimit) * 100
      : 0;

    console.log("📊 Daily percentage:", dailyPercentage.toFixed(1) + "%");
    console.log("📊 Monthly percentage:", monthlyPercentage.toFixed(1) + "%");
    console.log("🚨 Threshold:", settings.notificationThreshold + "%");

    console.log(
      "🔔 Should notify daily:",
      dailyPercentage >= (settings.notificationThreshold || 80)
    );
    console.log(
      "🔔 Should notify monthly:",
      monthlyPercentage >= (settings.notificationThreshold || 80)
    );

    // Test notification generation
    const { generateSpendingNotifications } = await import(
      "/src/api/spendingReminderService.js"
    );
    const notifications = await generateSpendingNotifications();
    console.log("🔔 Generated notifications:", notifications);
  } catch (error) {
    console.error("❌ Error calculating spending:", error);
  }
};

console.log("🔧 Debug tool loaded! Run: debugSpendingNotifications()");
