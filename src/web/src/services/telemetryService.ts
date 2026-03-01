import { ReactPlugin } from "@microsoft/applicationinsights-react-js";
import { ApplicationInsights, Snippet, ITelemetryItem } from "@microsoft/applicationinsights-web";
import { DistributedTracingModes } from "@microsoft/applicationinsights-common";
import { createBrowserHistory } from 'history'
import config from "../config";

const plugin = new ReactPlugin();
let applicationInsights: ApplicationInsights | undefined;
export const reactPlugin = plugin;

export const getApplicationInsights = (): ApplicationInsights | undefined => {
    const browserHistory = createBrowserHistory({ window: window });
    if (applicationInsights) {
        return applicationInsights;
    }

    const connectionString = config.observability.connectionString?.trim();
    if (!connectionString) {
        return undefined;
    }

    const ApplicationInsightsConfig: Snippet = {
        config: {
            connectionString: connectionString,
            enableCorsCorrelation: true,
            distributedTracingMode: DistributedTracingModes.W3C, 
            extensions: [plugin],
            extensionConfig: {
                [plugin.identifier]: { history: browserHistory }
            }
        }
    }

    applicationInsights = new ApplicationInsights(ApplicationInsightsConfig);
    try {
        applicationInsights.loadAppInsights();
        applicationInsights.addTelemetryInitializer((telemetry: ITelemetryItem) => {
            if (!telemetry) {
                return;
            }
            if (telemetry.tags) {
                telemetry.tags['ai.cloud.role'] = "webui";
            }
        });
    } catch(err) {
        applicationInsights = undefined;
    }

    return applicationInsights;
}

export const trackEvent = (eventName: string, properties?: { [key: string]: unknown }): void => {
    if (!applicationInsights) {
        return;
    }

    applicationInsights.trackEvent({
        name: eventName,
        properties: properties
    });
}
