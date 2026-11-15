import { expect, test } from '@playwright/test';

// AC-1, AC-4, AC-6, AC-7, AC-8, AC-9, AC-11 — the full standalone demo flow.
test('demo: onboarding → routine → intervention → structured → continue', async ({ page }) => {
  await page.goto('/');

  // Onboarding (FR-15)
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByTestId('onb-next').click();
  await page.getByRole('button', { name: '18–24' }).click();
  await page.getByLabel('What should Cortex call you?').fill('Sam');
  await page.getByTestId('onb-next').click();
  await page.getByRole('button', { name: 'College' }).click();
  await page.getByLabel('Field of study or work').fill('Computer Science');
  await page.getByTestId('onb-next').click();
  await page.getByRole('button', { name: 'Software engineering' }).click();
  await page.getByTestId('onb-next').click();
  await page.getByRole('button', { name: 'Coding' }).click();
  await page.getByRole('button', { name: 'Problem decomposition' }).click();
  await page.getByTestId('onb-next').click();
  await expect(page.getByTestId('profile-chip')).toHaveText('Sam · Software engineering');

  // TEST 1 / AC-1: routine passes straight through
  await page.getByTestId('composer').fill('What is the capital of Belgium?');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('note-pass')).toBeVisible();
  await expect(page.getByTestId('msg-ai').last()).toContainText('Brussels');
  await expect(page.getByTestId('cortex-card')).toHaveCount(0);

  await page.getByTestId('composer').fill('Convert 15 miles into kilometers.');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('msg-ai').last()).toContainText('24.14 kilometers');
  await expect(page.getByTestId('cortex-card')).toHaveCount(0);

  // TEST 2/3: meaningful task triggers a career-aware intervention
  await page.getByTestId('composer').fill('Help me create a portfolio website');
  await page.keyboard.press('Enter');
  const card = page.getByTestId('cortex-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('How would you break this into pieces?');
  await expect(card).toContainText(/Sam/);

  // TEST 4: a short unstructured thought
  await page.getByTestId('thought-input').fill(
    "I'd make a homepage, project section, and resume section. Probably use React components but I'm not sure how to organize them.",
  );
  await page.getByTestId('structure').click();

  // TEST 5 / AC-5, AC-6
  const s = page.getByTestId('structured');
  await expect(s).toContainText('Your idea, structured');
  await expect(page.getByTestId('goal')).toHaveText('Create a portfolio website');
  for (const t of ['Homepage', 'Project section', 'Resume section', 'Use React components', 'Decide how to organize the React components']) {
    await expect(s.locator('[data-source="you"]', { hasText: t })).toHaveCount(1);
  }
  await expect(page.getByTestId('suggestions')).toContainText('Cortex suggests');

  // TEST 7 / AC-8: continue into AI assistance with structured context
  await page.getByTestId('continue').click();
  await expect(page.getByTestId('enriched')).toContainText('Help me create a portfolio website');
  await expect(page.getByTestId('enriched')).toContainText('- Homepage');
  await expect(page.getByTestId('msg-ai').last()).toContainText('Building on your plan');
  await expect(page.getByTestId('stat-contributed')).toHaveText('1');

  // TEST 6 / AC-7: skip sends the original unchanged
  await page.getByTestId('composer').fill('Write my internship cover letter');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cortex-card')).toContainText(/experience|project/i);
  await page.getByTestId('skip').click();
  await expect(page.getByTestId('cortex-card')).toHaveCount(0);
  await expect(page.getByTestId('msg-user').last()).toHaveText('Write my internship cover letter');

  // TEST 8 / AC-9: profile persists across reload
  await page.reload();
  await expect(page.getByTestId('onboarding')).toHaveCount(0);
  await expect(page.getByTestId('profile-chip')).toHaveText('Sam · Software engineering');
});

test('demo: onboarding can be skipped and Cortex still works (FR-16)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('onb-skip').click();
  await page.getByTestId('composer').fill('Help me analyze this dataset');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cortex-card')).toContainText('What would you investigate first?');
});
