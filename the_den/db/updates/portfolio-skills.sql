DELETE FROM portfolio_skill_items item
USING portfolio_skill_groups group_row
WHERE item.group_id = group_row.id
	AND group_row.category = 'Data, AI & Quality'
	AND item.name = 'Power BI · MicroStrategy';

DELETE FROM portfolio_skill_items item
USING portfolio_skill_groups group_row
WHERE item.group_id = group_row.id
	AND group_row.category = 'Backend & APIs'
	AND item.name = 'Python · FastAPI';

WITH backend_group AS (
	SELECT id FROM portfolio_skill_groups WHERE category = 'Backend & APIs'
), next_order AS (
	SELECT COALESCE(MAX(item.sort_order), 0) + 1 AS sort_order
	FROM portfolio_skill_items item
	JOIN backend_group ON backend_group.id = item.group_id
)
INSERT INTO portfolio_skill_items (group_id, sort_order, name, level)
SELECT backend_group.id, next_order.sort_order, 'Python · FastAPI', 78
FROM backend_group CROSS JOIN next_order;

DELETE FROM portfolio_skill_items item
USING portfolio_skill_groups group_row
WHERE item.group_id = group_row.id
	AND group_row.category = 'Cloud & DevOps';

INSERT INTO portfolio_skill_items (group_id, sort_order, name, level)
SELECT id, 1, 'AWS', 88 FROM portfolio_skill_groups WHERE category = 'Cloud & DevOps'
UNION ALL
SELECT id, 2, 'Azure', 84 FROM portfolio_skill_groups WHERE category = 'Cloud & DevOps';
