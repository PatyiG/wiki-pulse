import { expect, test } from '@playwright/test';
import { sseBody } from './fixture.ts';

test.beforeEach(async ({ page }) => {
  // Serve the fixture once; afterwards keep the connection "open" with an empty body
  // so EventSource reconnects do not replay the same events.
  let served = false;
  await page.route('https://stream.wikimedia.org/**', async (route) => {
    const body = served ? ': keep-alive\n\n' : sseBody();
    served = true;
    await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body });
  });
});

test('shows streamed changes and hides bots by default', async ({ page }) => {
  await page.goto('/');
  const rows = page.getByTestId('event-row');
  await expect(rows).toHaveCount(6); // 8 changes, 2 of them by bots
  await expect(page.getByRole('cell', { name: 'Budapest' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'TidyBot' })).toHaveCount(0);
});

test('filters by type and keeps the filter in the URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('event-row')).toHaveCount(6);
  await page.getByLabel('Type').selectOption('new');
  await expect(page.getByTestId('event-row')).toHaveCount(2);
  await expect(page).toHaveURL(/\?type=new/);

  await page.reload();
  await expect(page.getByLabel('Type')).toHaveValue('new');
});

test('search matches page titles and users', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Search').fill('dan');
  await expect(page.getByTestId('event-row')).toHaveCount(1);
  await expect(page.getByRole('cell', { name: 'Danube' })).toBeVisible();
});

test('clicking a wiki in the sidebar filters the table', async ({ page }) => {
  await page.goto('/?bots=include');
  await expect(page.getByTestId('event-row')).toHaveCount(8);
  await page.getByRole('button', { name: /^huwiki/ }).click();
  await expect(page.getByTestId('event-row')).toHaveCount(2);
  await expect(page).toHaveURL(/wiki=huwiki/);
});

test('pause freezes the table', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('event-row')).toHaveCount(6);
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: /Resume/ })).toHaveAttribute('aria-pressed', 'true');
});
