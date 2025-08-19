import pool from '../config/database';
import { PoolClient } from 'pg';

/**
 * 关系分析服务
 * 实现最短路径、影响力分析、风险传播路径分析
 */

export interface GraphNode {
  id: string;
  type: 'enterprise' | 'person' | 'product';
  name: string;
  properties?: any;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  strength: number;
  properties?: any;
}

export interface PathResult {
  path: string[];
  totalDistance: number;
  steps: Array<{
    from: string;
    to: string;
    relationshipType: string;
    strength: number;
  }>;
}

export interface InfluenceScore {
  nodeId: string;
  centralityScore: number;
  betweennessCentrality: number;
  closenesssCentrality: number;
  eigenvectorCentrality: number;
  influenceRadius: number;
}

export interface RiskPropagationResult {
  sourceNode: string;
  affectedNodes: Array<{
    nodeId: string;
    riskLevel: number;
    propagationPath: string[];
    distance: number;
  }>;
  totalRiskExposure: number;
}

export class RelationshipAnalysisService {

  /**
   * 获取图数据
   */
  private static async getGraphData(client: PoolClient, nodeTypes?: string[]): Promise<{nodes: GraphNode[], edges: GraphEdge[]}> {
    // 获取节点数据
    let nodeQuery = `
      SELECT 'enterprise' as type, id, name, NULL as properties
      FROM enterprises
      WHERE status = 'active'
    `;
    
    if (nodeTypes && !nodeTypes.includes('enterprise')) {
      nodeQuery = 'SELECT NULL as type, NULL as id, NULL as name, NULL as properties WHERE FALSE';
    }
    
    // 可以根据需要添加人员和产品节点
    // UNION ALL SELECT 'person' as type, id, name, properties FROM persons
    // UNION ALL SELECT 'product' as type, id, name, properties FROM products
    
    const nodesResult = await client.query(nodeQuery);
    const nodes: GraphNode[] = nodesResult.rows.map(row => ({
      id: row.id,
      type: row.type,
      name: row.name,
      properties: row.properties
    }));

    // 获取边数据
    const edgesResult = await client.query(`
      SELECT from_id, to_id, relationship_type, strength, metadata as properties
      FROM relationships
      WHERE strength > 0
    `);
    
    const edges: GraphEdge[] = edgesResult.rows.map(row => ({
      from: row.from_id,
      to: row.to_id,
      type: row.relationship_type,
      strength: parseFloat(row.strength) || 0.5,
      properties: row.properties
    }));

    return { nodes, edges };
  }

  /**
   * 最短路径算法 (Dijkstra)
   * @param startNodeId 起始节点ID
   * @param endNodeId 结束节点ID
   * @param maxDepth 最大搜索深度
   */
  static async findShortestPath(
    startNodeId: string, 
    endNodeId: string, 
    maxDepth: number = 6
  ): Promise<PathResult | null> {
    const client = await pool.connect();
    
    try {
      const { nodes, edges } = await this.getGraphData(client);
      
      // 构建邻接表
      const graph = new Map<string, Array<{to: string, weight: number, type: string}>>();
      const nodeSet = new Set(nodes.map(n => n.id));
      
      // 验证起始和结束节点存在
      if (!nodeSet.has(startNodeId) || !nodeSet.has(endNodeId)) {
        return null;
      }
      
      // 初始化图
      for (const node of nodes) {
        graph.set(node.id, []);
      }
      
      // 添加边（考虑双向关系）
      for (const edge of edges) {
        if (nodeSet.has(edge.from) && nodeSet.has(edge.to)) {
          const weight = 1 / (edge.strength || 0.1); // 关系强度越高，距离越短
          graph.get(edge.from)?.push({ to: edge.to, weight, type: edge.type });
          graph.get(edge.to)?.push({ to: edge.from, weight, type: edge.type }); // 双向
        }
      }
      
      // Dijkstra算法
      const distances = new Map<string, number>();
      const previous = new Map<string, {nodeId: string, relationshipType: string}>();
      const visited = new Set<string>();
      const queue = new Set(nodes.map(n => n.id));
      
      // 初始化距离
      for (const nodeId of queue) {
        distances.set(nodeId, nodeId === startNodeId ? 0 : Infinity);
      }
      
      while (queue.size > 0) {
        // 找到距离最小的未访问节点
        let currentNode: string | null = null;
        let minDistance = Infinity;
        
        for (const nodeId of queue) {
          const distance = distances.get(nodeId) || Infinity;
          if (distance < minDistance) {
            minDistance = distance;
            currentNode = nodeId;
          }
        }
        
        if (!currentNode || minDistance === Infinity) break;
        
        queue.delete(currentNode);
        visited.add(currentNode);
        
        // 如果到达目标节点
        if (currentNode === endNodeId) {
          break;
        }
        
        // 检查深度限制
        if (minDistance > maxDepth) continue;
        
        // 更新邻居距离
        const neighbors = graph.get(currentNode) || [];
        for (const neighbor of neighbors) {
          if (visited.has(neighbor.to)) continue;
          
          const newDistance = minDistance + neighbor.weight;
          const currentDistance = distances.get(neighbor.to) || Infinity;
          
          if (newDistance < currentDistance) {
            distances.set(neighbor.to, newDistance);
            previous.set(neighbor.to, { 
              nodeId: currentNode, 
              relationshipType: neighbor.type 
            });
          }
        }
      }
      
      // 重建路径
      const path: string[] = [];
      const steps: PathResult['steps'] = [];
      let current = endNodeId;
      
      while (current && previous.has(current)) {
        path.unshift(current);
        const prev = previous.get(current)!;
        
        // 找到对应的边信息
        const edge = edges.find(e => 
          (e.from === prev.nodeId && e.to === current) ||
          (e.from === current && e.to === prev.nodeId)
        );
        
        steps.unshift({
          from: prev.nodeId,
          to: current,
          relationshipType: prev.relationshipType,
          strength: edge?.strength || 0.5
        });
        
        current = prev.nodeId;
      }
      
      if (current === startNodeId) {
        path.unshift(startNodeId);
        return {
          path,
          totalDistance: distances.get(endNodeId) || Infinity,
          steps
        };
      }
      
      return null; // 无路径
      
    } finally {
      client.release();
    }
  }

  /**
   * 影响力分析 - 计算节点的中心性指标
   */
  static async calculateInfluenceScores(nodeIds?: string[]): Promise<InfluenceScore[]> {
    const client = await pool.connect();
    
    try {
      const { nodes, edges } = await this.getGraphData(client);
      const targetNodes = nodeIds ? nodes.filter(n => nodeIds.includes(n.id)) : nodes;
      const results: InfluenceScore[] = [];
      
      for (const node of targetNodes) {
        const influence = await this.calculateNodeInfluence(node.id, nodes, edges);
        results.push(influence);
      }
      
      return results.sort((a, b) => b.centralityScore - a.centralityScore);
      
    } finally {
      client.release();
    }
  }

  /**
   * 计算单个节点的影响力指标
   */
  private static async calculateNodeInfluence(
    nodeId: string, 
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Promise<InfluenceScore> {
    
    // 1. 度中心性 (Degree Centrality)
    const connections = edges.filter(e => e.from === nodeId || e.to === nodeId);
    const degreeScore = connections.length;
    
    // 2. 加权度中心性 (考虑关系强度)
    const weightedDegreeScore = connections.reduce((sum, edge) => sum + edge.strength, 0);
    
    // 3. 介数中心性 (Betweenness Centrality) - 简化版本
    const betweennessCentrality = await this.calculateBetweennessCentrality(nodeId, nodes, edges);
    
    // 4. 紧密中心性 (Closeness Centrality)
    const closenesssCentrality = await this.calculateClosenessCentrality(nodeId, nodes, edges);
    
    // 5. 特征向量中心性 (简化版本)
    const eigenvectorCentrality = await this.calculateEigenvectorCentrality(nodeId, nodes, edges);
    
    // 6. 影响半径 (平均最短路径长度)
    const influenceRadius = await this.calculateInfluenceRadius(nodeId, nodes, edges);
    
    // 综合中心性评分 (加权平均)
    const centralityScore = (
      degreeScore * 0.3 +
      weightedDegreeScore * 0.2 +
      betweennessCentrality * 0.2 +
      closenesssCentrality * 0.15 +
      eigenvectorCentrality * 0.15
    );
    
    return {
      nodeId,
      centralityScore,
      betweennessCentrality,
      closenesssCentrality,
      eigenvectorCentrality,
      influenceRadius
    };
  }

  /**
   * 风险传播路径分析
   */
  static async analyzeRiskPropagation(
    riskSourceId: string, 
    riskLevel: number = 1.0,
    maxPropagationDepth: number = 4
  ): Promise<RiskPropagationResult> {
    const client = await pool.connect();
    
    try {
      const { nodes, edges } = await this.getGraphData(client);
      
      // 构建邻接表
      const graph = new Map<string, Array<{to: string, strength: number, type: string}>>();
      for (const node of nodes) {
        graph.set(node.id, []);
      }
      
      for (const edge of edges) {
        graph.get(edge.from)?.push({ 
          to: edge.to, 
          strength: edge.strength, 
          type: edge.type 
        });
        // 风险传播可能是单向或双向，这里假设某些关系类型是双向的
        if (['partnership', 'supply', 'investment'].includes(edge.type)) {
          graph.get(edge.to)?.push({ 
            to: edge.from, 
            strength: edge.strength, 
            type: edge.type 
          });
        }
      }
      
      // 风险传播算法 (类似BFS但考虑风险衰减)
      const riskScores = new Map<string, number>();
      const propagationPaths = new Map<string, string[]>();
      const distances = new Map<string, number>();
      const visited = new Set<string>();
      
      // 初始化
      riskScores.set(riskSourceId, riskLevel);
      propagationPaths.set(riskSourceId, [riskSourceId]);
      distances.set(riskSourceId, 0);
      
      const queue: Array<{nodeId: string, currentRisk: number, path: string[], depth: number}> = [
        { nodeId: riskSourceId, currentRisk: riskLevel, path: [riskSourceId], depth: 0 }
      ];
      
      while (queue.length > 0) {
        const { nodeId, currentRisk, path, depth } = queue.shift()!;
        
        if (visited.has(nodeId) || depth >= maxPropagationDepth) {
          continue;
        }
        
        visited.add(nodeId);
        
        const neighbors = graph.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (visited.has(neighbor.to)) continue;
          
          // 风险衰减计算 (基于关系强度和距离)
          const riskDecay = this.calculateRiskDecay(neighbor.type, neighbor.strength, depth + 1);
          const propagatedRisk = currentRisk * riskDecay;
          
          // 只有显著风险才继续传播
          if (propagatedRisk > 0.01) {
            const existingRisk = riskScores.get(neighbor.to) || 0;
            if (propagatedRisk > existingRisk) {
              riskScores.set(neighbor.to, propagatedRisk);
              propagationPaths.set(neighbor.to, [...path, neighbor.to]);
              distances.set(neighbor.to, depth + 1);
              
              queue.push({
                nodeId: neighbor.to,
                currentRisk: propagatedRisk,
                path: [...path, neighbor.to],
                depth: depth + 1
              });
            }
          }
        }
      }
      
      // 构建结果
      const affectedNodes: RiskPropagationResult['affectedNodes'] = [];
      for (const [nodeId, risk] of riskScores.entries()) {
        if (nodeId !== riskSourceId && risk > 0.01) {
          affectedNodes.push({
            nodeId,
            riskLevel: Math.round(risk * 100) / 100,
            propagationPath: propagationPaths.get(nodeId) || [],
            distance: distances.get(nodeId) || 0
          });
        }
      }
      
      const totalRiskExposure = Array.from(riskScores.values())
        .reduce((sum, risk) => sum + risk, 0);
      
      return {
        sourceNode: riskSourceId,
        affectedNodes: affectedNodes.sort((a, b) => b.riskLevel - a.riskLevel),
        totalRiskExposure: Math.round(totalRiskExposure * 100) / 100
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * 计算风险衰减系数
   */
  private static calculateRiskDecay(relationshipType: string, strength: number, distance: number): number {
    // 不同关系类型的风险传播系数
    const typeMultipliers: Record<string, number> = {
      'guarantee': 0.9,     // 担保关系风险传播强
      'investment': 0.8,    // 投资关系
      'supply': 0.6,        // 供应关系
      'partnership': 0.7,   // 合作关系
      'employment': 0.4,    // 雇佣关系
      'ownership': 0.85,    // 所有权关系
      'other': 0.3
    };
    
    const typeMultiplier = typeMultipliers[relationshipType] || 0.3;
    const strengthMultiplier = Math.pow(strength, 0.5); // 关系强度的平方根
    const distanceDecay = Math.pow(0.7, distance); // 距离衰减
    
    return typeMultiplier * strengthMultiplier * distanceDecay;
  }

  // 辅助方法 - 简化版本的中心性计算

  private static async calculateBetweennessCentrality(
    nodeId: string, 
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Promise<number> {
    // 简化版本：计算通过该节点的最短路径数量
    let betweenness = 0;
    const nodeIds = nodes.map(n => n.id);
    
    // 对于小规模图，可以计算所有节点对之间的最短路径
    // 这里使用简化的启发式方法
    const connections = edges.filter(e => e.from === nodeId || e.to === nodeId);
    const connectedNodes = new Set<string>();
    
    connections.forEach(edge => {
      connectedNodes.add(edge.from === nodeId ? edge.to : edge.from);
    });
    
    // 估算介数中心性：连接不同群组的节点具有更高的介数中心性
    betweenness = Math.min(connectedNodes.size * 0.1, 1.0);
    
    return betweenness;
  }

  private static async calculateClosenessCentrality(
    nodeId: string, 
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Promise<number> {
    // 简化版本：基于直接连接数和平均关系强度
    const connections = edges.filter(e => e.from === nodeId || e.to === nodeId);
    
    if (connections.length === 0) return 0;
    
    const avgStrength = connections.reduce((sum, edge) => sum + edge.strength, 0) / connections.length;
    const normalizedDegree = Math.min(connections.length / nodes.length, 1);
    
    return (normalizedDegree + avgStrength) / 2;
  }

  private static async calculateEigenvectorCentrality(
    nodeId: string, 
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Promise<number> {
    // 简化版本：基于连接节点的重要性
    const connections = edges.filter(e => e.from === nodeId || e.to === nodeId);
    
    if (connections.length === 0) return 0;
    
    // 计算连接节点的度数总和作为特征向量中心性的近似
    let neighborImportance = 0;
    const connectedNodeIds = connections.map(e => e.from === nodeId ? e.to : e.from);
    
    for (const connectedId of connectedNodeIds) {
      const neighborConnections = edges.filter(e => e.from === connectedId || e.to === connectedId);
      neighborImportance += neighborConnections.length * 0.1;
    }
    
    return Math.min(neighborImportance / nodes.length, 1);
  }

  private static async calculateInfluenceRadius(
    nodeId: string, 
    nodes: GraphNode[], 
    edges: GraphEdge[]
  ): Promise<number> {
    // 简化版本：计算平均距离
    const connections = edges.filter(e => e.from === nodeId || e.to === nodeId);
    
    if (connections.length === 0) return Infinity;
    
    // 估算影响半径：基于连接数量和关系强度
    const avgStrength = connections.reduce((sum, edge) => sum + edge.strength, 0) / connections.length;
    const radius = Math.max(1, 3 - connections.length * 0.1 - avgStrength);
    
    return Math.round(radius * 100) / 100;
  }
}

export default RelationshipAnalysisService; 