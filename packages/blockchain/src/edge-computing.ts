import {
    EdgeNode,
    EdgeDeployment,
    IEdgeService,
    EdgeError
} from './innovation-types';

/**
 * Edge Computing Service
 * Provides global edge infrastructure for low-latency gaming experiences
 */
export class EdgeComputingService implements IEdgeService {
    private edgeNodes: Map<string, EdgeNode> = new Map();
    private deployments: Map<string, EdgeDeployment> = new Map();
    private nodeHealthChecks: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        this.initializeGlobalEdgeNodes();
        this.startHealthMonitoring();
    }

    /**
     * Deploy service to edge nodes
     */
    async deployService(deploymentData: Omit<EdgeDeployment, 'id' | 'createdAt' | 'updatedAt'>): Promise<EdgeDeployment> {
        try {
            const deployment: EdgeDeployment = {
                ...deploymentData,
                id: this.generateId('deploy'),
                status: 'deploying',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Validate deployment configuration
            await this.validateDeployment(deployment);

            // Select optimal nodes for deployment
            const optimalNodes = await this.selectOptimalNodes(deployment);
            deployment.nodes = optimalNodes.map(node => node.id);

            this.deployments.set(deployment.id, deployment);

            // Start deployment process
            this.executeDeployment(deployment);

            return deployment;
        } catch (error) {
            throw new EdgeError(
                `Failed to deploy service: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DEPLOYMENT_FAILED'
            );
        }
    }

    /**
     * Update existing deployment
     */
    async updateDeployment(id: string, updates: Partial<EdgeDeployment>): Promise<EdgeDeployment> {
        const deployment = this.deployments.get(id);
        if (!deployment) {
            throw new EdgeError(`Deployment not found: ${id}`, 'DEPLOYMENT_NOT_FOUND');
        }

        const updatedDeployment: EdgeDeployment = {
            ...deployment,
            ...updates,
            id,
            updatedAt: new Date(),
        };

        this.deployments.set(id, updatedDeployment);

        // Apply updates to running deployment
        await this.applyDeploymentUpdates(updatedDeployment);

        return updatedDeployment;
    }

    /**
     * Stop deployment
     */
    async stopDeployment(id: string): Promise<void> {
        const deployment = this.deployments.get(id);
        if (!deployment) {
            throw new EdgeError(`Deployment not found: ${id}`, 'DEPLOYMENT_NOT_FOUND');
        }

        deployment.status = 'stopped';
        deployment.updatedAt = new Date();

        // Stop services on all nodes
        await this.stopServicesOnNodes(deployment.nodes);

        this.deployments.set(id, deployment);
    }

    /**
     * Get deployment by ID
     */
    async getDeployment(id: string): Promise<EdgeDeployment | null> {
        return this.deployments.get(id) || null;
    }

    /**
     * List all deployments
     */
    async listDeployments(): Promise<EdgeDeployment[]> {
        return Array.from(this.deployments.values())
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Get all edge nodes
     */
    async getEdgeNodes(): Promise<EdgeNode[]> {
        return Array.from(this.edgeNodes.values())
            .sort((a, b) => a.latency - b.latency);
    }

    /**
     * Get optimal node for location
     */
    async getOptimalNode(location: { latitude: number; longitude: number }): Promise<EdgeNode> {
        const nodes = await this.getEdgeNodes();
        const onlineNodes = nodes.filter(node => node.status === 'online');

        if (onlineNodes.length === 0) {
            throw new EdgeError('No online edge nodes available', 'NO_NODES_AVAILABLE');
        }

        // Calculate distances and select closest node with good performance
        const nodesWithDistance = onlineNodes.map(node => ({
            node,
            distance: this.calculateDistance(
                location.latitude,
                location.longitude,
                node.location.latitude,
                node.location.longitude
            ),
            score: this.calculateNodeScore(node),
        }));

        // Sort by combination of distance and performance score
        nodesWithDistance.sort((a, b) => {
            const scoreA = a.distance * 0.6 + (1 - a.score) * 0.4;
            const scoreB = b.distance * 0.6 + (1 - b.score) * 0.4;
            return scoreA - scoreB;
        });

        return nodesWithDistance[0].node;
    }

    /**
     * Scale deployment based on load
     */
    async scaleDeployment(
        deploymentId: string,
        targetScale: { minNodes: number; maxNodes: number; targetUtilization: number }
    ): Promise<void> {
        const deployment = await this.getDeployment(deploymentId);
        if (!deployment) {
            throw new EdgeError(`Deployment not found: ${deploymentId}`, 'DEPLOYMENT_NOT_FOUND');
        }

        const currentUtilization = await this.calculateDeploymentUtilization(deployment);

        if (currentUtilization > targetScale.targetUtilization && deployment.nodes.length < targetScale.maxNodes) {
            // Scale up
            await this.scaleUp(deployment, targetScale.maxNodes);
        } else if (currentUtilization < targetScale.targetUtilization * 0.7 && deployment.nodes.length > targetScale.minNodes) {
            // Scale down
            await this.scaleDown(deployment, targetScale.minNodes);
        }
    }

    /**
     * Get real-time metrics for deployment
     */
    async getDeploymentMetrics(deploymentId: string): Promise<{
        nodes: Array<{
            nodeId: string;
            cpu: number;
            memory: number;
            bandwidth: number;
            latency: number;
            requests: number;
        }>;
        aggregated: {
            totalRequests: number;
            averageLatency: number;
            errorRate: number;
            throughput: number;
        };
    }> {
        const deployment = await this.getDeployment(deploymentId);
        if (!deployment) {
            throw new EdgeError(`Deployment not found: ${deploymentId}`, 'DEPLOYMENT_NOT_FOUND');
        }

        const nodeMetrics = [];
        let totalRequests = 0;
        let totalLatency = 0;
        let totalErrors = 0;

        for (const nodeId of deployment.nodes) {
            const node = this.edgeNodes.get(nodeId);
            if (node) {
                const metrics = await this.getNodeMetrics(nodeId);
                nodeMetrics.push(metrics);
                totalRequests += metrics.requests;
                totalLatency += metrics.latency;
            }
        }

        return {
            nodes: nodeMetrics,
            aggregated: {
                totalRequests,
                averageLatency: totalLatency / deployment.nodes.length,
                errorRate: totalErrors / totalRequests,
                throughput: totalRequests / 60, // Requests per second
            },
        };
    }

    /**
     * Implement global load balancing
     */
    async routeRequest(
        deploymentId: string,
        request: {
            userLocation: { latitude: number; longitude: number };
            type: string;
            priority: 'low' | 'medium' | 'high';
        }
    ): Promise<{ nodeId: string; estimatedLatency: number }> {
        const deployment = await this.getDeployment(deploymentId);
        if (!deployment || deployment.status !== 'running') {
            throw new EdgeError(`Deployment not available: ${deploymentId}`, 'DEPLOYMENT_UNAVAILABLE');
        }

        // Get available nodes for this deployment
        const availableNodes = deployment.nodes
            .map(nodeId => this.edgeNodes.get(nodeId))
            .filter(node => node && node.status === 'online') as EdgeNode[];

        if (availableNodes.length === 0) {
            throw new EdgeError('No available nodes for deployment', 'NO_AVAILABLE_NODES');
        }

        // Apply routing strategy
        const selectedNode = await this.applyRoutingStrategy(
            availableNodes,
            deployment.routing.strategy,
            request
        );

        return {
            nodeId: selectedNode.id,
            estimatedLatency: selectedNode.latency,
        };
    }

    // Private helper methods

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async initializeGlobalEdgeNodes(): Promise<void> {
        const globalNodes: Omit<EdgeNode, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                name: 'US-West-1',
                location: {
                    country: 'United States',
                    region: 'West Coast',
                    city: 'Los Angeles',
                    latitude: 34.0522,
                    longitude: -118.2437,
                },
                capacity: { cpu: 32, memory: 128, storage: 2000, bandwidth: 10000 },
                utilization: { cpu: 45, memory: 60, storage: 30, bandwidth: 40 },
                services: ['game-server', 'ai-processing', 'asset-streaming'],
                status: 'online',
                latency: 15,
            },
            {
                name: 'US-East-1',
                location: {
                    country: 'United States',
                    region: 'East Coast',
                    city: 'New York',
                    latitude: 40.7128,
                    longitude: -74.0060,
                },
                capacity: { cpu: 32, memory: 128, storage: 2000, bandwidth: 10000 },
                utilization: { cpu: 55, memory: 70, storage: 45, bandwidth: 60 },
                services: ['game-server', 'database', 'cdn'],
                status: 'online',
                latency: 12,
            },
            {
                name: 'EU-Central-1',
                location: {
                    country: 'Germany',
                    region: 'Central Europe',
                    city: 'Frankfurt',
                    latitude: 50.1109,
                    longitude: 8.6821,
                },
                capacity: { cpu: 28, memory: 96, storage: 1500, bandwidth: 8000 },
                utilization: { cpu: 40, memory: 50, storage: 35, bandwidth: 45 },
                services: ['game-server', 'ai-processing'],
                status: 'online',
                latency: 18,
            },
            {
                name: 'Asia-Southeast-1',
                location: {
                    country: 'Singapore',
                    region: 'Southeast Asia',
                    city: 'Singapore',
                    latitude: 1.3521,
                    longitude: 103.8198,
                },
                capacity: { cpu: 24, memory: 64, storage: 1000, bandwidth: 6000 },
                utilization: { cpu: 35, memory: 45, storage: 25, bandwidth: 30 },
                services: ['game-server', 'cdn'],
                status: 'online',
                latency: 25,
            },
        ];

        for (const nodeData of globalNodes) {
            const node: EdgeNode = {
                ...nodeData,
                id: this.generateId('node'),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.edgeNodes.set(node.id, node);
        }
    }

    private startHealthMonitoring(): void {
        for (const [nodeId, node] of this.edgeNodes) {
            const healthCheck = setInterval(async () => {
                await this.performHealthCheck(nodeId);
            }, 30000); // Check every 30 seconds

            this.nodeHealthChecks.set(nodeId, healthCheck);
        }
    }

    private async performHealthCheck(nodeId: string): Promise<void> {
        const node = this.edgeNodes.get(nodeId);
        if (!node) return;

        // Mock health check
        const isHealthy = Math.random() > 0.05; // 95% uptime

        if (!isHealthy && node.status === 'online') {
            node.status = 'offline';
            node.updatedAt = new Date();
            console.warn(`Node ${nodeId} went offline`);
        } else if (isHealthy && node.status === 'offline') {
            node.status = 'online';
            node.updatedAt = new Date();
            console.log(`Node ${nodeId} came back online`);
        }

        // Update utilization metrics
        if (node.status === 'online') {
            node.utilization = {
                cpu: Math.max(10, Math.min(90, node.utilization.cpu + (Math.random() - 0.5) * 10)),
                memory: Math.max(20, Math.min(95, node.utilization.memory + (Math.random() - 0.5) * 15)),
                storage: Math.max(5, Math.min(80, node.utilization.storage + (Math.random() - 0.5) * 5)),
                bandwidth: Math.max(10, Math.min(90, node.utilization.bandwidth + (Math.random() - 0.5) * 20)),
            };
            node.latency = Math.max(5, node.latency + (Math.random() - 0.5) * 10);
        }

        this.edgeNodes.set(nodeId, node);
    }

    private async validateDeployment(deployment: EdgeDeployment): Promise<void> {
        if (!deployment.name || deployment.name.trim().length === 0) {
            throw new EdgeError('Deployment name is required', 'INVALID_DEPLOYMENT_NAME');
        }

        if (!deployment.service || deployment.service.trim().length === 0) {
            throw new EdgeError('Service name is required', 'INVALID_SERVICE_NAME');
        }

        if (deployment.nodes.length === 0) {
            throw new EdgeError('At least one node must be specified', 'NO_NODES_SPECIFIED');
        }
    }

    private async selectOptimalNodes(deployment: EdgeDeployment): Promise<EdgeNode[]> {
        const availableNodes = Array.from(this.edgeNodes.values())
            .filter(node =>
                node.status === 'online' &&
                node.services.includes(deployment.service) &&
                this.hasCapacity(node)
            );

        if (availableNodes.length === 0) {
            throw new EdgeError('No suitable nodes available for deployment', 'NO_SUITABLE_NODES');
        }

        // Sort by performance score
        availableNodes.sort((a, b) => this.calculateNodeScore(b) - this.calculateNodeScore(a));

        // Return top nodes based on deployment requirements
        const requiredNodes = Math.min(deployment.nodes.length || 3, availableNodes.length);
        return availableNodes.slice(0, requiredNodes);
    }

    private hasCapacity(node: EdgeNode): boolean {
        return (
            node.utilization.cpu < 80 &&
            node.utilization.memory < 85 &&
            node.utilization.storage < 90 &&
            node.utilization.bandwidth < 80
        );
    }

    private calculateNodeScore(node: EdgeNode): number {
        const utilizationScore = 1 - (
            (node.utilization.cpu + node.utilization.memory + node.utilization.bandwidth) / 300
        );
        const latencyScore = Math.max(0, 1 - node.latency / 100);

        return (utilizationScore * 0.7) + (latencyScore * 0.3);
    }

    private async executeDeployment(deployment: EdgeDeployment): Promise<void> {
        // Mock deployment execution
        setTimeout(() => {
            deployment.status = 'running';
            deployment.updatedAt = new Date();
            this.deployments.set(deployment.id, deployment);
        }, 5000); // Simulate 5-second deployment time
    }

    private async applyDeploymentUpdates(deployment: EdgeDeployment): Promise<void> {
        // Apply configuration updates to running services
        console.log(`Applying updates to deployment: ${deployment.id}`);
    }

    private async stopServicesOnNodes(nodeIds: string[]): Promise<void> {
        // Stop services on specified nodes
        console.log(`Stopping services on nodes: ${nodeIds.join(', ')}`);
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private async calculateDeploymentUtilization(deployment: EdgeDeployment): Promise<number> {
        let totalUtilization = 0;
        let nodeCount = 0;

        for (const nodeId of deployment.nodes) {
            const node = this.edgeNodes.get(nodeId);
            if (node) {
                const avgUtilization = (node.utilization.cpu + node.utilization.memory + node.utilization.bandwidth) / 3;
                totalUtilization += avgUtilization;
                nodeCount++;
            }
        }

        return nodeCount > 0 ? totalUtilization / nodeCount : 0;
    }

    private async scaleUp(deployment: EdgeDeployment, maxNodes: number): Promise<void> {
        const currentNodeCount = deployment.nodes.length;
        const nodesToAdd = Math.min(2, maxNodes - currentNodeCount);

        if (nodesToAdd > 0) {
            const additionalNodes = await this.selectOptimalNodes({
                ...deployment,
                nodes: [], // Find new nodes
            });

            deployment.nodes.push(...additionalNodes.slice(0, nodesToAdd).map(node => node.id));
            deployment.updatedAt = new Date();
            this.deployments.set(deployment.id, deployment);
        }
    }

    private async scaleDown(deployment: EdgeDeployment, minNodes: number): Promise<void> {
        const currentNodeCount = deployment.nodes.length;
        const nodesToRemove = Math.min(1, currentNodeCount - minNodes);

        if (nodesToRemove > 0) {
            // Remove least performing nodes
            const nodePerformances = deployment.nodes.map(nodeId => {
                const node = this.edgeNodes.get(nodeId);
                return { nodeId, score: node ? this.calculateNodeScore(node) : 0 };
            });

            nodePerformances.sort((a, b) => a.score - b.score);

            for (let i = 0; i < nodesToRemove; i++) {
                const nodeToRemove = nodePerformances[i].nodeId;
                deployment.nodes = deployment.nodes.filter(id => id !== nodeToRemove);
            }

            deployment.updatedAt = new Date();
            this.deployments.set(deployment.id, deployment);
        }
    }

    private async getNodeMetrics(nodeId: string): Promise<any> {
        const node = this.edgeNodes.get(nodeId);
        if (!node) {
            return null;
        }

        return {
            nodeId,
            cpu: node.utilization.cpu,
            memory: node.utilization.memory,
            bandwidth: node.utilization.bandwidth,
            latency: node.latency,
            requests: Math.floor(Math.random() * 1000) + 100, // Mock request count
        };
    }

    private async applyRoutingStrategy(
        nodes: EdgeNode[],
        strategy: EdgeDeployment['routing']['strategy'],
        request: any
    ): Promise<EdgeNode> {
        switch (strategy) {
            case 'round-robin':
                return nodes[Math.floor(Math.random() * nodes.length)];

            case 'latency':
                return nodes.reduce((best, current) =>
                    current.latency < best.latency ? current : best
                );

            case 'load':
                return nodes.reduce((best, current) => {
                    const currentLoad = (current.utilization.cpu + current.utilization.memory) / 2;
                    const bestLoad = (best.utilization.cpu + best.utilization.memory) / 2;
                    return currentLoad < bestLoad ? current : best;
                });

            case 'geography':
                return nodes.reduce((closest, current) => {
                    const currentDistance = this.calculateDistance(
                        request.userLocation.latitude,
                        request.userLocation.longitude,
                        current.location.latitude,
                        current.location.longitude
                    );
                    const closestDistance = this.calculateDistance(
                        request.userLocation.latitude,
                        request.userLocation.longitude,
                        closest.location.latitude,
                        closest.location.longitude
                    );
                    return currentDistance < closestDistance ? current : closest;
                });

            default:
                return nodes[0];
        }
    }
}

export default EdgeComputingService;
