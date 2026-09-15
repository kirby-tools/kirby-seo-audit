<?php

declare(strict_types = 1);

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\Test;

#[RunTestsInSeparateProcesses]
#[PreserveGlobalState(false)]
final class ContextRouteTest extends ApiRouteTestCase
{
    private function callContextRoute(array $options): mixed
    {
        return $this->callRoute(
            self::bootApp(['options' => ['johannschopplich.seo-audit' => $options]]),
            '__seo-audit__/context'
        );
    }

    #[Test]
    public function sends_only_auto_and_log_level_to_the_panel(): void
    {
        $response = $this->callContextRoute([
            'auto' => 'publish',
            'logLevel' => 'debug',
            'proxy' => ['params' => ['basicAuth' => 'user:hunter2']],
            'someFutureOption' => 'test-secret'
        ]);

        $this->assertSame(['auto' => 'publish', 'logLevel' => 'debug'], $response['config']);

        // Any Panel user of any role can read this response, so the guard
        // covers the whole envelope rather than the `config` key alone.
        $payload = json_encode($response);

        $this->assertStringNotContainsString('hunter2', $payload);
        $this->assertStringNotContainsString('test-secret', $payload);
    }
}
